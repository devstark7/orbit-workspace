const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    subject: { type: String, required: true },
    demoExpiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Activity', schema);
