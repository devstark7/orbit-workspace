export const STATUSES = ['Todo', 'In Progress', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const LABELS = ['Design', 'Engineering', 'Research', 'Product'];
export const recordId = (value) => value?._id || value;
export const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
export function calendarDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
export function isOverdue(task, now = new Date()) {
  return (
    task.status !== 'Done' &&
    !!task.dueDate &&
    calendarDate(task.dueDate) < calendarDate(new Date(now))
  );
}
export function filterTasks(
  tasks,
  { query = '', status = 'All', priority = 'All', mine = false, userId } = {},
) {
  const q = query.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      (!q ||
        [t.title, t.description, t.project?.name, t.label].some((s) =>
          s?.toLowerCase().includes(q),
        )) &&
      (status === 'All' || t.status === status) &&
      (priority === 'All' || t.priority === priority) &&
      (!mine || recordId(t.assignedTo) === userId),
  );
}
export function summarize(tasks, userId, now = new Date()) {
  const done = tasks.filter((t) => t.status === 'Done').length;
  return {
    total: tasks.length,
    done,
    progress: tasks.filter((t) => t.status === 'In Progress').length,
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
    mine: tasks.filter((t) => recordId(t.assignedTo) === userId && t.status !== 'Done').length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}
export function completionSeries(tasks, days = 7, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    return {
      date: d,
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      value: tasks.filter(
        (t) =>
          t.status === 'Done' &&
          t.completedAt &&
          new Date(t.completedAt) >= d &&
          new Date(t.completedAt) < end,
      ).length,
    };
  });
}
export function dateLabel(value, options = { month: 'short', day: 'numeric' }) {
  return value
    ? new Date(calendarDate(value) + 'T12:00:00.000Z').toLocaleDateString('en', {
        ...options,
        timeZone: 'UTC',
      })
    : 'No due date';
}
export function timeAgo(value, now = Date.now()) {
  const m = Math.max(0, Math.floor((now - new Date(value)) / 60000));
  return m < 1
    ? 'Just now'
    : m < 60
      ? `${m}m ago`
      : m < 1440
        ? `${Math.floor(m / 60)}h ago`
        : `${Math.floor(m / 1440)}d ago`;
}
export function csvExport(tasks) {
  const cell = (s) =>
    '"' +
    String(s ?? '')
      .replace(/"/g, '""')
      .replace(/^(?:\s*[=+@\-]|[\t\r\n])/, "'$&") +
    '"';
  return [
    ['Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due date'],
    ...tasks.map((t) => [
      t.title,
      t.project?.name,
      t.status,
      t.priority,
      t.assignedTo?.name,
      t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '',
    ]),
  ]
    .map((row) => row.map(cell).join(','))
    .join('\r\n');
}
