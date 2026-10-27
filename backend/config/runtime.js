const crypto = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Set JWT_SECRET to at least 32 random characters in production.');
}
module.exports = {
  production,
  secret: process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex'),
  origin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
  demo: !production || process.env.ENABLE_DEMO === 'true',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: production,
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  },
};
