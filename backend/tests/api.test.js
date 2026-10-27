const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { connectDB, closeDB } = require('../config/db');
const app = require('../app');
const User = require('../models/User');
let alice, bob, outsider, project, task, aliceId, bobId;
const password = 'A-long-test-password-2026';
before(
  async () => {
    await connectDB();
    alice = request.agent(app);
    bob = request.agent(app);
    outsider = request.agent(app);
    const a = await alice
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'Alice@example.com', password, role: 'Admin' })
      .expect(201);
    aliceId = a.body._id;
    const b = await bob
      .post('/api/auth/signup')
      .send({ name: 'Bob', email: 'bob@example.com', password })
      .expect(201);
    bobId = b.body._id;
    await outsider
      .post('/api/auth/signup')
      .send({ name: 'Outsider', email: 'outsider@example.com', password })
      .expect(201);
    project = (
      await alice
        .post('/api/projects')
        .send({ name: 'Private launch', description: 'Test workspace', color: 'violet' })
        .expect(201)
    ).body;
    task = (
      await alice
        .post('/api/tasks')
        .send({
          title: 'Ship carefully',
          project: project._id,
          priority: 'High',
          label: 'Engineering',
          assignedTo: aliceId,
        })
        .expect(201)
    ).body;
  },
  { timeout: 180000 },
);
after(closeDB);
test('health waits for a connected database', async () => {
  const r = await request(app).get('/api/health').expect(200);
  assert.equal(r.body.database, 'connected');
});
test('public signup cannot grant admin privileges', async () => {
  const u = await User.findById(aliceId);
  assert.equal(u.role, 'Member');
});
test('sessions use HTTP-only SameSite cookies and never return tokens', async () => {
  const r = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ALICE@example.com', password })
    .expect(200);
  assert.match(r.headers['set-cookie'][0], /HttpOnly/);
  assert.match(r.headers['set-cookie'][0], /SameSite=Lax/);
  assert.equal(r.body.token, undefined);
  assert.equal(r.body.password, undefined);
});
test('passwords are hashed and excluded from profile', async () => {
  const u = await User.findById(aliceId).select('+password');
  assert.notEqual(u.password, password);
  assert.equal(await u.matchPassword(password), true);
  const me = await alice.get('/api/auth/me').expect(200);
  assert.equal(me.body.password, undefined);
});
test('unauthenticated users cannot list projects or tasks', async () => {
  await request(app).get('/api/projects').expect(401);
  await request(app).get('/api/tasks').expect(401);
});
test('outsider cannot read a known project or filter tasks by its ID', async () => {
  await bob.get('/api/projects/' + project._id).expect(403);
  await bob.get('/api/tasks?projectId=' + project._id).expect(403);
  const r = await bob.get('/api/tasks').expect(200);
  assert.equal(r.body.length, 0);
});
test('outsider cannot create, update, comment on, or delete a project task', async () => {
  await bob.post('/api/tasks').send({ title: 'Intrusion', project: project._id }).expect(403);
  await bob
    .patch('/api/tasks/' + task._id)
    .send({ status: 'Done' })
    .expect(403);
  await bob
    .post('/api/tasks/' + task._id + '/comments')
    .send({ text: 'Intrusion' })
    .expect(403);
  await bob.delete('/api/tasks/' + task._id).expect(403);
});
test('unknown and malformed IDs return clear 404 and 400 responses', async () => {
  await alice.get('/api/projects/not-an-id').expect(400);
  await alice.patch('/api/tasks/000000000000000000000000').send({ status: 'Done' }).expect(404);
});
test('assignees must belong to the task project', async () => {
  await alice
    .patch('/api/tasks/' + task._id)
    .send({ assignedTo: bobId })
    .expect(400);
});
test('only the owner can invite members; invited member can collaborate', async () => {
  await bob
    .post('/api/projects/' + project._id + '/members')
    .send({ email: 'outsider@example.com' })
    .expect(403);
  await alice
    .post('/api/projects/' + project._id + '/members')
    .send({ email: 'bob@example.com' })
    .expect(200);
  await bob.get('/api/tasks?projectId=' + project._id).expect(200);
  await bob
    .patch('/api/tasks/' + task._id)
    .send({ status: 'In Progress' })
    .expect(200);
  await bob
    .patch('/api/projects/' + project._id)
    .send({ name: 'Takeover' })
    .expect(403);
  await bob.delete('/api/projects/' + project._id).expect(403);
});
test('members cannot delete tasks created by other members', async () => {
  await bob.delete('/api/tasks/' + task._id).expect(403);
});
test('task transitions record completion time and reopening clears it', async () => {
  const r = await alice
    .patch('/api/tasks/' + task._id)
    .send({ status: 'Done' })
    .expect(200);
  assert.ok(r.body.completedAt);
  const s = await alice
    .patch('/api/tasks/' + task._id)
    .send({ status: 'Todo', assignedTo: null, dueDate: null })
    .expect(200);
  assert.equal(s.body.completedAt, null);
  assert.equal(s.body.assignedTo, null);
  assert.equal(s.body.dueDate, null);
});
test('rejects whitespace titles, invalid enum, dates, and object injection', async () => {
  for (const body of [
    { title: '  ' },
    { status: 'Hacked' },
    { dueDate: 'not-a-date' },
    { title: { $ne: null } },
  ])
    await alice
      .patch('/api/tasks/' + task._id)
      .send(body)
      .expect(400);
  await alice
    .post('/api/tasks')
    .send({ title: 'New', project: project._id, assignedTo: { $ne: null } })
    .expect(400);
});
test('comments and audit history are persisted and scoped to members', async () => {
  const r = await bob
    .post('/api/tasks/' + task._id + '/comments')
    .send({ text: 'Ready for review.' })
    .expect(201);
  assert.equal(r.body.comments[0].text, 'Ready for review.');
  assert.equal(r.body.comments[0].author.name, 'Bob');
  const a = await alice.get('/api/activity').expect(200);
  assert.ok(a.body.some((e) => e.action === 'commented on'));
  const o = await outsider.get('/api/activity').expect(200);
  assert.equal(o.body.length, 0);
});
test('archived projects reject new tasks; owner can reopen', async () => {
  await alice
    .patch('/api/projects/' + project._id)
    .send({ status: 'Archived' })
    .expect(200);
  await alice.post('/api/tasks').send({ title: 'Wait', project: project._id }).expect(400);
  await alice
    .patch('/api/projects/' + project._id)
    .send({ status: 'Active' })
    .expect(200);
});
test('cross-origin writes are denied; same-origin requests work', async () => {
  await alice
    .patch('/api/tasks/' + task._id)
    .set('Origin', 'https://evil.example')
    .send({ title: 'Bad' })
    .expect(403);
  await alice
    .patch('/api/tasks/' + task._id)
    .set('Origin', 'http://127.0.0.1:5173')
    .send({ title: 'Good' })
    .expect(200);
});
test('public signup normalizes email and rejects duplicate or weak credentials', async () => {
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Someone', email: 'ALICE@example.com', password })
    .expect(409);
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Someone', email: 'new@example.com', password: 'short' })
    .expect(400);
  await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@example.com', password: 'wrong' })
    .expect(401);
});
test('demo creates separate fictional workspaces, never shared accounts', async () => {
  const a = request.agent(app),
    b = request.agent(app);
  await a.post('/api/auth/demo').send({}).expect(201);
  await b.post('/api/auth/demo').send({}).expect(201);
  const pa = (await a.get('/api/projects').expect(200)).body,
    pb = (await b.get('/api/projects').expect(200)).body;
  assert.equal(pa.length, 3);
  assert.equal(pb.length, 3);
  assert.notEqual(pa[0]._id, pb[0]._id);
  await b.get('/api/tasks?projectId=' + pa[0]._id).expect(403);
  const t = (await a.get('/api/tasks').expect(200)).body;
  assert.equal(t.length, 15);
  await a
    .post('/api/projects/' + pa[0]._id + '/members')
    .send({ email: 'bob@example.com' })
    .expect(403);
});
test('deleting a project removes related tasks and activity', async () => {
  await alice.delete('/api/projects/' + project._id).expect(200);
  const tasks = await alice.get('/api/tasks').expect(200);
  assert.equal(tasks.body.length, 0);
  const a = await alice.get('/api/activity').expect(200);
  assert.equal(a.body.length, 0);
});
test('logout revokes the session rather than only clearing the cookie', async () => {
  const r = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@example.com', password })
    .expect(200);
  const cookie = r.headers['set-cookie'][0].split(';')[0];
  await request(app).post('/api/auth/logout').set('Cookie', cookie).send({}).expect(200);
  await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401);
});
