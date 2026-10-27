const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const path = require('node:path');
const mongoose = require('mongoose');
const runtime = require('./config/runtime');
const { protect } = require('./middleware/authMiddleware');
const auth = require('./controllers/authController');
const projects = require('./controllers/projectController');
const tasks = require('./controllers/taskController');
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'font-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
      },
    },
  }),
);
app.use(cors({ origin: runtime.origin, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const origin = req.get('origin');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && origin !== runtime.origin)
    return res.status(403).json({ message: 'Request origin is not allowed.' });
  next();
});
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});
const demoLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demo limit reached. Create an account or try again later.' },
});
const apiLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Please slow down and try again.' },
});
app.get('/api/health', (req, res) =>
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    demo: runtime.demo,
  }),
);
app.post('/api/auth/signup', authLimit, wrap(auth.signup));
app.post('/api/auth/login', authLimit, wrap(auth.login));
app.post('/api/auth/demo', demoLimit, wrap(auth.demo));
app.get('/api/auth/me', protect, wrap(auth.me));
app.post('/api/auth/logout', protect, wrap(auth.logout));
app.use('/api', apiLimit, protect);
app.get('/api/projects', wrap(projects.list));
app.post('/api/projects', wrap(projects.create));
app.get('/api/activity', wrap(projects.activity));
app.get('/api/projects/:id', wrap(projects.get));
app.patch('/api/projects/:id', wrap(projects.update));
app.delete('/api/projects/:id', wrap(projects.remove));
app.post('/api/projects/:id/members', wrap(projects.invite));
app.get('/api/tasks', wrap(tasks.list));
app.post('/api/tasks', wrap(tasks.create));
app.patch('/api/tasks/:id', wrap(tasks.update));
app.delete('/api/tasks/:id', wrap(tasks.remove));
app.post('/api/tasks/:id/comments', wrap(tasks.comment));
app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
if (runtime.production) {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));
}
app.use((err, req, res, next) => {
  let status = err.status || 500;
  if (
    err.name === 'ValidationError' ||
    err.name === 'CastError' ||
    err.type === 'entity.parse.failed'
  )
    status = 400;
  if (err.code === 11000) status = 409;
  if (status === 500) console.error(err);
  res.status(status).json({
    message:
      status >= 500
        ? 'Something went wrong. Please try again.'
        : err.code === 11000
          ? 'An account with this email already exists.'
          : err.message,
  });
});
module.exports = app;
