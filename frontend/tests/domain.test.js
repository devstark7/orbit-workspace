import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterTasks,
  summarize,
  completionSeries,
  csvExport,
  isOverdue,
  initials,
} from '../src/lib/domain.js';
const now = new Date('2026-10-27T12:00:00'),
  tasks = [
    {
      _id: '1',
      title: 'Design navigation',
      description: 'Keyboard first',
      project: { _id: 'p', name: 'Website' },
      label: 'Design',
      status: 'Done',
      priority: 'High',
      assignedTo: { _id: 'a' },
      completedAt: '2026-10-26T14:00:00',
      dueDate: '2026-10-25',
    },
    {
      _id: '2',
      title: 'API validation',
      project: { _id: 'p', name: 'Website' },
      label: 'Engineering',
      status: 'In Progress',
      priority: 'High',
      assignedTo: { _id: 'b' },
      dueDate: '2026-10-26',
    },
    {
      _id: '3',
      title: 'Document flow',
      project: { _id: 'q', name: 'Mobile' },
      status: 'Todo',
      priority: 'Low',
      assignedTo: null,
      dueDate: '2026-10-27T23:59:00',
    },
  ];
test('search, priority, status, and assignee filters compose', () => {
  assert.deepEqual(
    filterTasks(tasks, { query: ' website ', priority: 'High', mine: true, userId: 'a' }).map(
      (t) => t._id,
    ),
    ['1'],
  );
  assert.equal(filterTasks(tasks, { query: 'keyboard' }).length, 1);
  assert.equal(filterTasks(tasks, { status: 'Todo' }).length, 1);
});
test('overdue counts exclude completed tasks and the current calendar day', () => {
  assert.equal(isOverdue(tasks[0], now), false);
  assert.equal(isOverdue(tasks[1], now), true);
  assert.equal(isOverdue(tasks[2], now), false);
  assert.equal(summarize(tasks, 'b', now).overdue, 1);
});
test('summaries handle empty workspaces without NaN', () => {
  assert.equal(summarize([], 'a').percent, 0);
  assert.deepEqual(summarize(tasks, 'b', now), {
    total: 3,
    done: 1,
    progress: 1,
    overdue: 1,
    mine: 1,
    percent: 33,
  });
});
test('completion chart uses recorded completion dates, including zero days', () => {
  const series = completionSeries(tasks, 7, now);
  assert.equal(series.length, 7);
  assert.equal(
    series.reduce((a, d) => a + d.value, 0),
    1,
  );
  assert.equal(series[5].value, 1);
  assert.equal(series[6].value, 0);
});
test('CSV escapes commas, quotes, and spreadsheet formula prefixes', () => {
  const csv = csvExport([{ title: '=SUM(1,2) "x"', project: { name: 'A,B' }, status: 'Todo' }]);
  assert.ok(csv.includes('"\'=SUM(1,2) ""x"""'));
  assert.ok(csv.includes('"A,B"'));
  assert.ok(csv.includes('\r\n'));
});
test('avatar initials handle empty and multi-part names', () => {
  assert.equal(initials('Maya Chen'), 'MC');
  assert.equal(initials(''), '?');
  assert.equal(initials('Alex Morgan Rivera'), 'AM');
});
