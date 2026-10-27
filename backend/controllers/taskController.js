const crypto = require('node:crypto');
const Task = require('../models/Task');
const Project = require('../models/Project');
const v = require('../lib/validation');
const transaction = require('../lib/transaction');
const { projectAccess, visibleProjects, record, includesUser } = require('../lib/access');
const populate = (q) =>
  q
    .populate({ path: 'assignedTo', select: 'name email', ordered: true })
    .populate({ path: 'createdBy', select: 'name', ordered: true })
    .populate({ path: 'project', select: 'name color owner members', ordered: true })
    .populate({ path: 'comments.author', select: 'name', ordered: true });
function fields(b, t) {
  if (b.title !== undefined) t.title = v.text(b.title, 'Title', 160, true);
  if (b.description !== undefined) t.description = v.text(b.description, 'Description', 4000);
  if (b.priority !== undefined)
    t.priority = v.choice(b.priority, ['Low', 'Medium', 'High'], 'priority');
  if (b.label !== undefined)
    t.label = v.choice(b.label, ['Design', 'Engineering', 'Research', 'Product'], 'label');
  if (b.dueDate !== undefined) t.dueDate = v.date(b.dueDate);
  if (b.status !== undefined) {
    const s = v.choice(b.status, ['Todo', 'In Progress', 'Done'], 'status');
    if (s !== t.status) t.completedAt = s === 'Done' ? new Date() : null;
    t.status = s;
  }
}
function assignee(value, p) {
  if (value === null || value === '') return null;
  v.id(value);
  if (!includesUser(p, value)) throw new v.HttpError(400, 'Assignee must belong to this project.');
  return value;
}
exports.list = async (req, res) => {
  const ids = req.query.projectId
    ? [(await projectAccess(req.query.projectId, req.user))._id]
    : (await Project.find(visibleProjects(req.user)).select('_id')).map((p) => p._id);
  res.json(await populate(Task.find({ project: { $in: ids } }).sort('-createdAt')));
};
exports.create = async (req, res) => {
  const result = await transaction(async () => {
    const p = await projectAccess(req.body.project, req.user, false, true);
    if (p.status !== 'Active')
      throw new v.HttpError(400, 'Reopen this project before adding tasks.');
    const t = new Task({
      title: v.text(req.body.title, 'Title', 160, true),
      project: p._id,
      createdBy: req.user._id,
      demoExpiresAt: p.demoExpiresAt,
    });
    fields(req.body, t);
    if (req.body.assignedTo !== undefined) t.assignedTo = assignee(req.body.assignedTo, p);
    if (req.body.clientRequestId !== undefined) {
      const key = v.text(req.body.clientRequestId, 'Request ID', 80, true);
      if (!/^[a-zA-Z0-9_-]{16,80}$/.test(key)) throw new v.HttpError(400, 'Invalid request ID.');
      const hash = crypto
        .createHash('sha256')
        .update(
          JSON.stringify({
            project: String(p._id),
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            label: t.label,
            dueDate: t.dueDate?.toISOString() || null,
            assignedTo: t.assignedTo ? String(t.assignedTo) : null,
          }),
        )
        .digest('hex');
      const previous = await Task.findOne({ createdBy: req.user._id, requestKey: key }).select(
        '+requestHash',
      );
      if (previous) {
        if (previous.requestHash !== hash)
          throw new v.HttpError(
            409,
            'This request ID was already used for different task details.',
          );
        return { status: 200, task: await populate(Task.findById(previous._id)) };
      }
      t.requestKey = key;
      t.requestHash = hash;
    }
    await t.save();
    await record(p, req.user, 'created task', t.title);
    return { status: 201, task: await populate(Task.findById(t._id)) };
  });
  res.status(result.status).json(result.task);
};
async function access(req) {
  const t = await Task.findById(v.id(req.params.id));
  if (!t) throw new v.HttpError(404, 'Task not found.');
  const p = await projectAccess(String(t.project), req.user, false, true);
  return { t, p };
}
exports.update = async (req, res) => {
  const result = await transaction(async () => {
    const { t, p } = await access(req);
    fields(req.body, t);
    if (req.body.assignedTo !== undefined) t.assignedTo = assignee(req.body.assignedTo, p);
    await t.save();
    await record(p, req.user, 'updated task', t.title);
    return populate(Task.findById(t._id));
  });
  res.json(result);
};
exports.remove = async (req, res) => {
  await transaction(async () => {
    const { t, p } = await access(req);
    if (String(p.owner) !== String(req.user._id) && String(t.createdBy) !== String(req.user._id))
      throw new v.HttpError(403, 'Only the project owner or task creator can delete this task.');
    await t.deleteOne();
    await record(p, req.user, 'deleted task', t.title);
  });
  res.json({ message: 'Task deleted.' });
};
exports.comment = async (req, res) => {
  const result = await transaction(async () => {
    const { t, p } = await access(req);
    if (t.comments.length >= 100)
      throw new v.HttpError(400, 'This task has reached its comment limit.');
    t.comments.push({ author: req.user._id, text: v.text(req.body.text, 'Comment', 2000, true) });
    await t.save();
    await record(p, req.user, 'commented on', t.title);
    return populate(Task.findById(t._id));
  });
  res.status(201).json(result);
};
