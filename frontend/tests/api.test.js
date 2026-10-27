import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, ApiError } from '../src/lib/api.js';

test('API client handles failures without reporting a successful save', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await t.test('rejects HTML returned with a successful status', async () => {
    globalThis.fetch = async () => new Response('<html>Proxy error</html>', { status: 200 });
    await assert.rejects(
      api('/tasks'),
      (error) =>
        error instanceof ApiError &&
        error.status === 200 &&
        /unexpected response/.test(error.message),
    );
  });

  await t.test('rejects null and primitive response bodies', async () => {
    for (const body of ['null', '"ok"', '42']) {
      globalThis.fetch = async () => new Response(body);
      await assert.rejects(api('/tasks'), /unexpected response/);
    }
  });

  await t.test('preserves server validation messages', async () => {
    globalThis.fetch = async () => Response.json({ message: 'Invalid due date.' }, { status: 400 });
    await assert.rejects(
      api('/tasks'),
      (error) => error.status === 400 && error.message === 'Invalid due date.',
    );
  });

  await t.test('supports empty successful responses', async () => {
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await api('/tasks/1', { method: 'DELETE' }), null);
  });

  await t.test('accepts collection and record responses used by the workspace', async () => {
    for (const value of [[], [{ _id: 'task-1' }], { _id: 'project-1' }]) {
      globalThis.fetch = async () => Response.json(value);
      assert.deepEqual(await api('/tasks'), value);
    }
  });

  await t.test('distinguishes timeouts from other connection failures', async () => {
    globalThis.fetch = async () => {
      throw new DOMException('Timeout', 'TimeoutError');
    };
    await assert.rejects(api('/tasks'), /took too long/);
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    await assert.rejects(api('/tasks'), /Cannot reach the server/);
  });
});
