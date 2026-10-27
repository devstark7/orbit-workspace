const Task = require('../models/Task');
const Project = require('../models/Project');
const v = require('../lib/validation');
const { projectAccess, visibleProjects, record, includesUser } = require('../lib/access');
const populate = (q) =>
  q
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name')
    .populate('project', 'name color owner members')
    .populate('comments.author', 'name');
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
function assignee(value, project) {
  if (value === null || value === '') return null;
  v.id(value);
  if (!includesUser(project, value))
    throw new v.HttpError(400, 'Assignee must belong to this project.');
  return value;
}
exports.list = async (req, res) => {
  let ids;
  if (req.query.projectId) {
    const p = await projectAccess(req.query.projectId, req.user);
    ids = [p._id];
  } else ids = (await Project.find(visibleProjects(req.user)).select('_id')).map((p) => p._id);
  res.json(await populate(Task.find({ project: { $in: ids } }).sort('-createdAt')));
};
exports.create = async (req, res) => {
  const p = await projectAccess(req.body.project, req.user);
  if (p.status !== 'Active') throw new v.HttpError(400, 'Reopen this project before adding tasks.');
  const t = new Task({
    title: v.text(req.body.title, 'Title', 160, true),
    project: p._id,
    createdBy: req.user._id,
    demoExpiresAt: p.demoExpiresAt,
  });
  fields(req.body, t);
  if (req.body.assignedTo !== undefined) t.assignedTo = assignee(req.body.assignedTo, p);
  await t.save();
  await record(p, req.user, 'created task', t.title);
  res.status(201).json(await populate(Task.findById(t._id)));
};
async function access(req) {
  const t = await Task.findById(v.id(req.params.id));
  if (!t) throw new v.HttpError(404, 'Task not found.');
  const p = await projectAccess(String(t.project), req.user);
  return { t, p };
}
exports.update = async (req, res) => {
  const { t, p } = await access(req);
  fields(req.body, t);
  if (req.body.assignedTo !== undefined) t.assignedTo = assignee(req.body.assignedTo, p);
  await t.save();
  await record(p, req.user, 'updated task', t.title);
  res.json(await populate(Task.findById(t._id)));
};
exports.remove = async (req, res) => {
  const { t, p } = await access(req);
  if (String(p.owner) !== String(req.user._id) && String(t.createdBy) !== String(req.user._id))
    throw new v.HttpError(403, 'Only the project owner or task creator can delete this task.');
  await t.deleteOne();
  await record(p, req.user, 'deleted task', t.title);
  res.json({ message: 'Task deleted.' });
};
exports.comment = async (req, res) => {
  const { t, p } = await access(req);
  if (t.comments.length >= 100)
    throw new v.HttpError(400, 'This task has reached its comment limit.');
  t.comments.push({ author: req.user._id, text: v.text(req.body.text, 'Comment', 2000, true) });
  await t.save();
  await record(p, req.user, 'commented on', t.title);
  res.status(201).json(await populate(Task.findById(t._id)));
};
