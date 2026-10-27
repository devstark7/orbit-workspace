const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const User = require('../models/User');
const v = require('../lib/validation');
const { projectAccess, visibleProjects, record } = require('../lib/access');
const populate = (q) => q.populate('owner', 'name email').populate('members', 'name email');
exports.list = async (req, res) =>
  res.json(await populate(Project.find(visibleProjects(req.user)).sort('-createdAt')));
exports.get = async (req, res) => {
  const p = await projectAccess(req.params.id, req.user);
  res.json(await populate(Project.findById(p._id)));
};
exports.create = async (req, res) => {
  const p = await Project.create({
    name: v.text(req.body.name, 'Project name', 100, true),
    description: v.text(req.body.description ?? '', 'Description', 2000),
    color: v.choice(req.body.color ?? 'lime', ['lime', 'violet', 'peach', 'blue'], 'color'),
    dueDate: req.body.dueDate ? v.date(req.body.dueDate) : null,
    owner: req.user._id,
    members: [],
    demoExpiresAt: req.user.demoExpiresAt,
  });
  await record(p, req.user, 'created project', p.name);
  res.status(201).json(await populate(Project.findById(p._id)));
};
exports.update = async (req, res) => {
  const p = await projectAccess(req.params.id, req.user, true),
    b = req.body;
  if (b.name !== undefined) p.name = v.text(b.name, 'Project name', 100, true);
  if (b.description !== undefined) p.description = v.text(b.description, 'Description', 2000);
  if (b.status !== undefined)
    p.status = v.choice(b.status, ['Active', 'Completed', 'Archived'], 'status');
  if (b.color !== undefined)
    p.color = v.choice(b.color, ['lime', 'violet', 'peach', 'blue'], 'color');
  if (b.dueDate !== undefined) p.dueDate = v.date(b.dueDate);
  await p.save();
  await record(p, req.user, 'updated project', p.name);
  res.json(await populate(Project.findById(p._id)));
};
exports.invite = async (req, res) => {
  const p = await projectAccess(req.params.id, req.user, true);
  if (req.user.demoExpiresAt)
    throw new v.HttpError(403, 'Create a real account to invite teammates.');
  const u = await User.findOne({
    email: v.email(req.body.email),
    demoExpiresAt: { $exists: false },
  });
  if (!u) throw new v.HttpError(404, 'Ask your teammate to create an Orbit account first.');
  if (String(u._id) !== String(p.owner) && !p.members.some((m) => String(m) === String(u._id))) {
    if (p.members.length >= 50) throw new v.HttpError(400, 'A project supports up to 50 members.');
    p.members.push(u._id);
    await p.save();
    await record(p, req.user, 'added teammate', u.name);
  }
  res.json(await populate(Project.findById(p._id)));
};
exports.remove = async (req, res) => {
  const p = await projectAccess(req.params.id, req.user, true);
  await Task.deleteMany({ project: p._id });
  await Activity.deleteMany({ project: p._id });
  await p.deleteOne();
  res.json({ message: 'Project deleted.' });
};
exports.activity = async (req, res) => {
  const projects = await Project.find(visibleProjects(req.user)).select('_id');
  res.json(
    await Activity.find({ project: { $in: projects.map((p) => p._id) } })
      .sort('-createdAt')
      .limit(40)
      .populate('actor', 'name')
      .populate('project', 'name color'),
  );
};
