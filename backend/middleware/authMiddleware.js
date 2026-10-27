const jwt = require('jsonwebtoken');
const User = require('../models/User');
const runtime = require('../config/runtime');
async function protect(req, res, next) {
  try {
    const token = req.cookies.orbit_session;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const decoded = jwt.verify(token, runtime.secret, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id);
    if (
      !user ||
      user.sessionVersion !== decoded.version ||
      (user.demoExpiresAt && user.demoExpiresAt < new Date())
    )
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}
module.exports = { protect };
