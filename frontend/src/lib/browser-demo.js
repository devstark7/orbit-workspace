import seed from './demo-seed.json' with { type: 'json' };

const key = 'orbit.review-demo.v1';
const id = (value) => value?._id || value;
const clone = (value) => structuredClone(value);
const now = () => new Date().toISOString();
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

export function freshDemo() {
  const data = clone(seed);
  // Keep relative sample deadlines useful whenever an evaluator opens the demo.
  const anchor = Math.max(...seed.activity.map((a) => Date.parse(a.createdAt))) + 3600000;
  const offset = Date.now() - anchor;
  function dates(value) {
    if (!value || typeof value !== 'object') return;
    for (const [field, child] of Object.entries(value)) {
      if (['dueDate', 'completedAt', 'createdAt', 'updatedAt'].includes(field) && child)
        value[field] = new Date(Date.parse(child) + offset).toISOString();
      else if (child && typeof child === 'object') dates(child);
    }
    delete value.demoExpiresAt;
    delete value.__v;
  }
  dates(data);
  data.user.demo = true;
  return data;
}

export function createDemoClient(storage) {
  let data;
  try {
    data = JSON.parse(storage.getItem(key));
  } catch {
    /* A fresh demo is safe if storage is unavailable. */
  }
  if (!data?.user || !Array.isArray(data.projects) || !Array.isArray(data.tasks))
    data = freshDemo();
  function persist() {
    try {
      storage.setItem(key, JSON.stringify(data));
    } catch {
      fail('Browser storage is unavailable or full. Allow site storage to save demo changes.', 507);
    }
  }
  function projectFor(projectId) {
    return data.projects.find((p) => p._id === projectId) || fail('Project not found.', 404);
  }
  function populate(task) {
    return { ...clone(task), project: clone(projectFor(id(task.project))) };
  }
  function activity(project, action, subject) {
    data.activity.unshift({
      _id: crypto.randomUUID(),
      actor: clone(data.user),
      project: clone(project),
      action,
      subject,
      createdAt: now(),
    });
    data.activity = data.activity.slice(0, 40);
  }
  return async (path, { method = 'GET', body = {} } = {}) => {
    const before = clone(data);
    try {
      if (path === '/auth/me') return clone(data.user);
      if (path === '/auth/demo') {
        data = freshDemo();
        persist();
        return clone(data.user);
      }
      if (path === '/auth/logout') return { message: 'Demo closed.' };
      if (path.startsWith('/auth/'))
        fail(
          'This is a browser-only demo. Use Explore demo; real accounts are available in the full-stack source.',
        );
      if (path === '/projects' && method === 'GET') return clone(data.projects);
      if (path === '/tasks' && method === 'GET') return data.tasks.map(populate);
      if (path === '/activity' && method === 'GET') return clone(data.activity);
      if (path === '/projects' && method === 'POST') {
        if (!body.name?.trim()) fail('Enter a project name.');
        const project = {
          ...body,
          name: body.name.trim(),
          _id: crypto.randomUUID(),
          owner: clone(data.user),
          members: [],
          status: 'Active',
          createdAt: now(),
        };
        data.projects.unshift(project);
        activity(project, 'created project', project.name);
        persist();
        return clone(project);
      }
      const projectRoute = path.match(/^\/projects\/([^/]+)(\/members)?$/);
      if (projectRoute) {
        const project = projectFor(projectRoute[1]);
        if (projectRoute[2])
          fail(
            'The browser demo cannot invite real accounts. Explore the seeded teammates or run the full-stack app.',
          );
        if (method === 'PATCH') {
          Object.assign(project, body);
          activity(project, 'updated project', project.name);
        } else if (method === 'DELETE') {
          data.projects = data.projects.filter((p) => p._id !== project._id);
          data.tasks = data.tasks.filter((t) => id(t.project) !== project._id);
          data.activity = data.activity.filter((a) => id(a.project) !== project._id);
        } else if (method !== 'GET') fail('Unsupported demo action.');
        persist();
        return clone(project);
      }
      if (path === '/tasks' && method === 'POST') {
        const project = projectFor(id(body.project));
        if (project.status !== 'Active') fail('Reopen this project before adding tasks.');
        if (!body.title?.trim()) fail('Enter a task title.');
        const existing =
          body.clientRequestId &&
          data.tasks.find((t) => t.clientRequestId === body.clientRequestId);
        if (existing) return populate(existing);
        const people = [project.owner, ...project.members];
        const assignedTo = body.assignedTo ? people.find((p) => p._id === body.assignedTo) : null;
        if (body.assignedTo && !assignedTo) fail('Assignee must belong to this project.');
        const task = {
          status: 'Todo',
          priority: 'Medium',
          label: 'Engineering',
          ...body,
          title: body.title.trim(),
          _id: crypto.randomUUID(),
          project: project._id,
          assignedTo,
          createdBy: clone(data.user),
          comments: [],
          createdAt: now(),
          completedAt: body.status === 'Done' ? now() : null,
        };
        data.tasks.unshift(task);
        activity(project, 'created task', task.title);
        persist();
        return populate(task);
      }
      const taskRoute = path.match(/^\/tasks\/([^/]+)(\/comments)?$/);
      if (taskRoute) {
        const task = data.tasks.find((t) => t._id === taskRoute[1]) || fail('Task not found.', 404);
        const project = projectFor(id(task.project));
        if (taskRoute[2] && method === 'POST') {
          if (!body.text?.trim()) fail('Enter a comment.');
          task.comments.push({
            _id: crypto.randomUUID(),
            author: clone(data.user),
            text: body.text.trim(),
            createdAt: now(),
          });
          activity(project, 'commented on', task.title);
        } else if (method === 'PATCH') {
          const patch = { ...body };
          if ('assignedTo' in patch) {
            patch.assignedTo = patch.assignedTo
              ? [project.owner, ...project.members].find((p) => p._id === patch.assignedTo)
              : null;
            if (body.assignedTo && !patch.assignedTo) fail('Assignee must belong to this project.');
          }
          if (body.status && body.status !== task.status)
            patch.completedAt = body.status === 'Done' ? now() : null;
          Object.assign(task, patch, { updatedAt: now() });
          activity(project, 'updated task', task.title);
        } else if (method === 'DELETE') {
          data.tasks = data.tasks.filter((t) => t._id !== task._id);
          activity(project, 'deleted task', task.title);
        } else fail('Unsupported demo action.');
        persist();
        return populate(task);
      }
      fail('This action is not available in the browser demo.', 404);
    } catch (error) {
      data = before;
      throw error;
    }
  };
}

let client;
export async function demoApi(path, options) {
  client ||= createDemoClient(window.localStorage);
  return client(path, options);
}
