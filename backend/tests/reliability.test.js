const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');
const { connectDB, closeDB } = require('../config/db');
const app = require('../app');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
let agent;
before(
  async () => {
    await connectDB();
    agent = request.agent(app);
    await agent
      .post('/api/auth/signup')
      .send({
        name: 'Reliability reviewer',
        email: 'reliability@example.invalid',
        password: 'Reliable-password-2026',
      })
      .expect(201);
  },
  { timeout: 180000 },
);
after(closeDB);
async function setup() {
  const p = (await agent.post('/api/projects').send({ name: 'Atomic workspace' }).expect(201)).body;
  return p;
}
async function auditFailure(work) {
  const original = Activity.create,
    log = console.error;
  Activity.create = async () => {
    throw new Error('Injected audit failure');
  };
  console.error = () => {};
  try {
    return await work();
  } finally {
    Activity.create = original;
    console.error = log;
  }
}
test('failed audit rolls back task creation; retry commits exactly one task', async () => {
  const p = await setup(),
    body = { project: p._id, title: 'One intended task', clientRequestId: crypto.randomUUID() };
  await auditFailure(() => agent.post('/api/tasks').send(body).expect(500));
  assert.equal(await Task.countDocuments({ project: p._id }), 0);
  await agent.post('/api/tasks').send(body).expect(201);
  assert.equal(await Task.countDocuments({ project: p._id }), 1);
  assert.equal(await Activity.countDocuments({ project: p._id, action: 'created task' }), 1);
});
test('replaying a successful task request returns the original without another audit event', async () => {
  const p = await setup(),
    body = { project: p._id, title: 'Retry-safe task', clientRequestId: crypto.randomUUID() };
  const first = await agent.post('/api/tasks').send(body).expect(201),
    retry = await agent.post('/api/tasks').send(body).expect(200);
  assert.equal(retry.body._id, first.body._id);
  assert.equal(retry.body.requestHash, undefined);
  assert.equal(retry.body.requestKey, undefined);
  assert.equal(await Task.countDocuments({ project: p._id }), 1);
  assert.equal(await Activity.countDocuments({ project: p._id, action: 'created task' }), 1);
  await agent
    .post('/api/tasks')
    .send({ ...body, title: 'Different content' })
    .expect(409);
});
test('simultaneous task retries create only one task', async () => {
  const p = await setup(),
    body = { project: p._id, title: 'Concurrent retry', clientRequestId: crypto.randomUUID() };
  const responses = await Promise.all(
    Array.from({ length: 3 }, () => agent.post('/api/tasks').send(body)),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 200, 201]);
  assert.equal(new Set(responses.map((r) => r.body._id)).size, 1);
  assert.equal(await Task.countDocuments({ project: p._id }), 1);
});
test('failed audit rolls back status changes and comments', async () => {
  const p = await setup(),
    t = (
      await agent.post('/api/tasks').send({ project: p._id, title: 'Stay consistent' }).expect(201)
    ).body;
  await auditFailure(() =>
    agent
      .patch('/api/tasks/' + t._id)
      .send({ status: 'Done' })
      .expect(500),
  );
  assert.equal((await Task.findById(t._id)).status, 'Todo');
  await auditFailure(() =>
    agent
      .post('/api/tasks/' + t._id + '/comments')
      .send({ text: 'Not committed' })
      .expect(500),
  );
  assert.equal((await Task.findById(t._id)).comments.length, 0);
});
test('failed audit rolls back task deletion', async () => {
  const p = await setup(),
    t = (
      await agent
        .post('/api/tasks')
        .send({ project: p._id, title: 'Keep me on failure' })
        .expect(201)
    ).body;
  await auditFailure(() => agent.delete('/api/tasks/' + t._id).expect(500));
  assert.ok(await Task.exists({ _id: t._id }));
});
test('failed audit rolls back project creation and edits', async () => {
  const count = await Project.countDocuments();
  await auditFailure(() => agent.post('/api/projects').send({ name: 'Uncommitted' }).expect(500));
  assert.equal(await Project.countDocuments(), count);
  const p = await setup();
  await auditFailure(() =>
    agent
      .patch('/api/projects/' + p._id)
      .send({ name: 'Uncommitted edit' })
      .expect(500),
  );
  assert.equal((await Project.findById(p._id)).name, p.name);
});
test('failed project deletion restores its tasks and activity', async () => {
  const p = await setup();
  await agent
    .post('/api/tasks')
    .send({ project: p._id, title: 'Keep the whole project' })
    .expect(201);
  const original = Project.prototype.deleteOne,
    log = console.error;
  Project.prototype.deleteOne = async () => {
    throw new Error('Injected delete failure');
  };
  console.error = () => {};
  try {
    await agent.delete('/api/projects/' + p._id).expect(500);
  } finally {
    Project.prototype.deleteOne = original;
    console.error = log;
  }
  assert.ok(await Project.exists({ _id: p._id }));
  assert.equal(await Task.countDocuments({ project: p._id }), 1);
  assert.equal(await Activity.countDocuments({ project: p._id }), 2);
});
