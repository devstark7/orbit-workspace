const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { id, HttpError } = require('./validation');
const includesUser = (project, userId) =>
  String(project.owner._id || project.owner) === String(userId) ||
  project.members.some((m) => String(m._id || m) === String(userId));
async function projectAccess(projectId, user, ownerOnly = false, lock = false) {
  const p = await Project.findById(id(projectId));
  if (!p) throw new HttpError(404, 'Project not found.');
  if (!includesUser(p, user._id) || (ownerOnly && String(p.owner) !== String(user._id)))
    throw new HttpError(
      403,
      ownerOnly ? 'Only the project owner can do that.' : 'You do not have access to this project.',
    );
  // Coordinate all project mutations with deletion/archiving in the same transaction.
  if (lock) await Project.updateOne({ _id: p._id }, { $inc: { revision: 1 } });
  return p;
}
const visibleProjects = (user) => ({ $or: [{ owner: user._id }, { members: user._id }] });
async function record(project, actor, action, subject) {
  await Activity.create({
    project: project._id,
    actor: actor._id,
    action,
    subject,
    demoExpiresAt: project.demoExpiresAt,
  });
}
module.exports = { projectAccess, includesUser, visibleProjects, record };
