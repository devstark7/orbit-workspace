const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
    sessionVersion: { type: Number, default: 0 },
    demoExpiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true },
);
schema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
schema.methods.matchPassword = function (value) {
  return bcrypt.compare(value, this.password);
};
module.exports = mongoose.model('User', schema);
