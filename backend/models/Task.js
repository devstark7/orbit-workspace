const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 4000 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    label: {
      type: String,
      enum: ['Design', 'Engineering', 'Research', 'Product'],
      default: 'Engineering',
    },
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    demoExpiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true },
);
schema.index({ project: 1, status: 1 });
module.exports = mongoose.model('Task', schema);
