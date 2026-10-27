const crypto = require('node:crypto');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Activity = require('./models/Activity');
const day = (offset) => new Date(Date.now() + offset * 86400000);
async function seedDemo(key) {
  const expires = day(1),
    password = crypto.randomBytes(24).toString('hex');
  const people = await User.create([
    {
      name: 'Alex Morgan',
      email: `alex.${key}@demo.orbit.invalid`,
      password,
      demoExpiresAt: expires,
    },
    {
      name: 'Maya Chen',
      email: `maya.${key}@demo.orbit.invalid`,
      password,
      demoExpiresAt: expires,
    },
    {
      name: 'Jordan Lee',
      email: `jordan.${key}@demo.orbit.invalid`,
      password,
      demoExpiresAt: expires,
    },
    {
      name: 'Sam Rivera',
      email: `sam.${key}@demo.orbit.invalid`,
      password,
      demoExpiresAt: expires,
    },
  ]);
  const briefs = [
    [
      'Website experience',
      'A considered digital home. Build a clear, expressive experience from first impression to final interaction.',
      'violet',
      9,
    ],
    [
      'Orbit mobile app',
      'Less friction, more flow. Bring the workspace to the moments between everything else.',
      'lime',
      16,
    ],
    [
      'Brand foundations',
      'Define the details that make us unmistakable. A living system for a growing product.',
      'peach',
      23,
    ],
  ];
  const projects = [];
  for (const [name, description, color, due] of briefs)
    projects.push(
      await Project.create({
        name,
        description,
        color,
        dueDate: day(due),
        owner: people[0]._id,
        members: people.slice(1).map((u) => u._id),
        demoExpiresAt: expires,
      }),
    );
  const rows = [
    ['Map the onboarding journey', 'Research', 'Done', 'High', 0, -4, 1],
    ['Explore the visual direction', 'Design', 'Done', 'High', 0, -3, 0],
    ['Build the component library', 'Engineering', 'In Progress', 'High', 0, 2, 2],
    ['Design the dashboard experience', 'Design', 'In Progress', 'High', 0, 1, 0],
    ['Polish the empty states', 'Design', 'Todo', 'Medium', 0, 4, 1],
    ['Accessibility & keyboard audit', 'Engineering', 'Todo', 'High', 0, 5, 3],
    ['Write the launch story', 'Product', 'Todo', 'Low', 0, 7, 0],
    ['Set up navigation patterns', 'Engineering', 'Done', 'Medium', 1, -2, 2],
    ['Prototype the quick-add flow', 'Design', 'In Progress', 'High', 1, 3, 1],
    ['Offline sync architecture', 'Engineering', 'Todo', 'High', 1, 6, 0],
    ['Test notification preferences', 'Research', 'Todo', 'Medium', 1, 8, 3],
    ['Define the color system', 'Design', 'Done', 'High', 2, -5, 0],
    ['Document typography rules', 'Design', 'Done', 'Medium', 2, -1, 1],
    ['Create the icon guidelines', 'Design', 'In Progress', 'Medium', 2, 4, 3],
    ['Review the voice & tone', 'Product', 'Todo', 'Low', 2, -1, 0],
  ];
  const details = [
    'Outline the first-run experience from welcome to first task. Include the empty, loading, and error states so nobody gets stuck.',
    'Explore a warmer visual language for the workspace. Compare typography, color, and contrast at desktop and phone sizes.',
    'Create shared form fields, buttons, and dialogs. Document focus, disabled, loading, and validation behavior.',
    'Give the overview a clear information hierarchy. Connect the summary cards to filtered views and use real completion timestamps.',
    'Write useful empty-state messages for projects, tasks, and search. Each state should offer one clear next step.',
    'Walk through every workflow without a mouse. Check dialog focus, form labels, contrast, and reduced-motion behavior.',
    'Explain what the workspace helps people do. Prepare a short product walkthrough with honest screenshots and setup instructions.',
    'Map the main navigation and project drill-down. Keep a clear way back and preserve readable task names on narrow screens.',
    'Prototype a task form that stays out of the way. Test sensible defaults, empty descriptions, and creating several tasks in a row.',
    'Define how queued changes would reconcile after reconnecting. Document conflict cases before choosing a sync strategy.',
    'Interview teammates about reminder frequency. Check that pausing reminders is easy and preferences are understandable.',
    'Define the neutral and accent scales with contrast in mind. Keep status text readable without relying on color alone.',
    'Set heading, body, label, and metadata scales. Verify long titles and local font loading on slow connections.',
    'Choose a consistent stroke, size, and spacing system. Add accessible names to icon-only controls.',
    'Review messages from sign-in to task completion. Keep instructions clear, errors actionable, and success states calm.',
  ];
  for (let i = 0; i < rows.length; i++) {
    const [title, label, status, priority, p, due, u] = rows[i];
    await Task.create({
      title,
      label,
      status,
      priority,
      project: projects[p]._id,
      assignedTo: people[u]._id,
      createdBy: people[0]._id,
      dueDate: day(due),
      completedAt: status === 'Done' ? day(due) : null,
      description: details[i],
      demoExpiresAt: expires,
      createdAt: day(-8 + i * 0.2),
    });
  }
  for (const [actor, action, subject, p, hours] of [
    [1, 'completed task', 'Document typography rules', 2, 1],
    [2, 'updated task', 'Build the component library', 0, 2],
    [0, 'created task', 'Write the launch story', 0, 3],
    [3, 'commented on', 'Create the icon guidelines', 2, 5],
    [1, 'completed task', 'Map the onboarding journey', 0, 8],
  ]) {
    await Activity.create({
      actor: people[actor]._id,
      action,
      subject,
      project: projects[p]._id,
      demoExpiresAt: expires,
      createdAt: new Date(Date.now() - hours * 3600000),
    });
  }
  return people[0];
}
module.exports = { seedDemo };
