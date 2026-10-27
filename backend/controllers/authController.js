const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const runtime = require('../config/runtime');
const v = require('../lib/validation');
const profile = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  demo: !!u.demoExpiresAt,
});
function session(res, u) {
  res.cookie(
    'orbit_session',
    jwt.sign({ id: u._id, version: u.sessionVersion }, runtime.secret, {
      expiresIn: '8h',
      algorithm: 'HS256',
    }),
    runtime.cookie,
  );
  return profile(u);
}
exports.signup = async (req, res) => {
  const name = v.text(req.body.name, 'Name', 80, true),
    email = v.email(req.body.email),
    password = req.body.password;
  if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 72)
    throw new v.HttpError(400, 'Password must be at least 10 characters and at most 72 bytes.');
  if (await User.exists({ email }))
    throw new v.HttpError(409, 'An account with this email already exists.');
  const u = await User.create({ name, email, password, role: 'Member' });
  res.status(201).json(session(res, u));
};
exports.login = async (req, res) => {
  const email = v.email(req.body.email),
    password = req.body.password;
  if (typeof password !== 'string' || Buffer.byteLength(password) > 72)
    throw new v.HttpError(400, 'Invalid password.');
  const u = await User.findOne({ email }).select('+password');
  if (!u || !(await u.matchPassword(password)))
    throw new v.HttpError(401, 'Email or password is incorrect.');
  res.json(session(res, u));
};
exports.me = async (req, res) => res.json(profile(req.user));
exports.logout = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { sessionVersion: 1 } });
  const { maxAge, ...options } = runtime.cookie;
  res.clearCookie('orbit_session', options).json({ message: 'Signed out.' });
};
exports.demo = async (req, res) => {
  if (!runtime.demo) throw new v.HttpError(404, 'Demo sessions are disabled.');
  const { seedDemo } = require('../seed');
  const u = await seedDemo(crypto.randomUUID());
  res.status(201).json(session(res, u));
};
