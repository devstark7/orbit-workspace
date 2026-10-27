const mongoose = require('mongoose');
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function id(value) {
  if (typeof value !== 'string' || !mongoose.isObjectIdOrHexString(value))
    throw new HttpError(400, 'Invalid record ID.');
  return value;
}
function text(value, name, max, required = false) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()))
    throw new HttpError(400, name + ' must be ' + (required ? '1–' : '0–') + max + ' characters.');
  return value.trim();
}
function choice(value, values, name) {
  if (!values.includes(value)) throw new HttpError(400, 'Invalid ' + name + '.');
  return value;
}
function date(value) {
  if (value === null || value === '') return null;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value.slice(0, 10)).toISOString().slice(0, 10) !== value.slice(0, 10)
  )
    throw new HttpError(400, 'Invalid due date.');
  // A due date is a calendar day, not an instant in the visitor's timezone.
  return new Date(value.slice(0, 10) + 'T00:00:00.000Z');
}
function email(value) {
  value = text(value, 'Email', 254, true).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(value)) throw new HttpError(400, 'Enter a valid email address.');
  return value;
}
module.exports = { HttpError, id, text, choice, date, email };
