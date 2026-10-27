import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createSubmissionKey } from '../src/lib/submission.js';

for (const zone of [
  'America/Los_Angeles',
  'America/New_York',
  'Asia/Kolkata',
  'Pacific/Kiritimati',
  'UTC',
]) {
  test('calendar deadlines stay correct in ' + zone, () => {
    const code = `import {dateLabel,isOverdue} from './src/lib/domain.js';
      const task={status:'Todo',dueDate:'2026-10-28T00:00:00.000Z'};
      console.log(JSON.stringify({label:dateLabel(task.dueDate),before:isOverdue(task,new Date(2026,9,27,23,59)),on:isOverdue(task,new Date(2026,9,28,23,59)),after:isOverdue(task,new Date(2026,9,29,0,1)),dst:dateLabel('2026-11-01T00:00:00.000Z')}));`;
    const result = JSON.parse(
      execFileSync(process.execPath, ['--input-type=module', '-e', code], {
        cwd: new URL('../', import.meta.url),
        env: { ...process.env, TZ: zone },
        encoding: 'utf8',
      }),
    );
    assert.deepEqual(result, {
      label: 'Oct 28',
      before: false,
      on: false,
      after: true,
      dst: 'Nov 1',
    });
  });
}
test('a task retry reuses its key; edited details and new forms receive new keys', () => {
  let n = 0;
  const generate = () => String(++n),
    key = createSubmissionKey(generate);
  assert.equal(key({ title: 'Build' }), '1');
  assert.equal(key({ title: 'Build' }), '1');
  assert.equal(key({ title: 'Review' }), '2');
  assert.equal(createSubmissionKey(generate)({ title: 'Review' }), '3');
});
