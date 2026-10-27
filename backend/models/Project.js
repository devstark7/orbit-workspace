const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    revision: { type: Number, default: 0 },
    description: { type: String, default: '', maxlength: 2000 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
    color: { type: String, enum: ['lime', 'violet', 'peach', 'blue'], default: 'lime' },
    dueDate: { type: Date, default: null },
    demoExpiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true },
);
schema.index({ owner: 1 });
schema.index({ members: 1 });
module.exports = mongoose.model('Project', schema);
