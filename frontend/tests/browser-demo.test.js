import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoClient } from '../src/lib/browser-demo.js';

function storage() {
  const values = new Map();
  return { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
}
test('browser demo supports evaluation without a server and persists changes', async () => {
  const disk = storage(),
    api = createDemoClient(disk);
  const user = await api('/auth/me');
  assert.equal(user.demo, true);
  const projects = await api('/projects');
  assert.equal(projects.length, 3);
  assert.equal((await api('/tasks')).length, 15);
  const task = await api('/tasks', {
    method: 'POST',
    body: {
      project: projects[0]._id,
      title: 'Evaluator task',
      assignedTo: user._id,
      clientRequestId: 'review-1',
    },
  });
  const replay = await api('/tasks', {
    method: 'POST',
    body: { project: projects[0]._id, title: 'Evaluator task', clientRequestId: 'review-1' },
  });
  assert.equal(replay._id, task._id);
  await api('/tasks/' + task._id, { method: 'PATCH', body: { status: 'Done' } });
  await api('/tasks/' + task._id + '/comments', { method: 'POST', body: { text: 'Reviewed' } });
  const reloaded = createDemoClient(disk);
  const saved = (await reloaded('/tasks')).find((t) => t._id === task._id);
  assert.equal(saved.status, 'Done');
  assert.ok(saved.completedAt);
  assert.equal(saved.comments[0].text, 'Reviewed');
  await reloaded('/projects/' + projects[0]._id, { method: 'DELETE' });
  assert.equal(
    (await reloaded('/tasks')).some((t) => t.project._id === projects[0]._id),
    false,
  );
  await reloaded('/auth/demo', { method: 'POST' });
  assert.equal((await reloaded('/tasks')).length, 15);
});

test('browser demo rolls back mutations if storage cannot save', async () => {
  const api = createDemoClient({
    getItem: () => null,
    setItem: () => {
      throw new Error('quota');
    },
  });
  const before = await api('/projects');
  await assert.rejects(api('/projects', { method: 'POST', body: { name: 'Unsaved' } }), /storage/);
  assert.deepEqual(await api('/projects'), before);
});
