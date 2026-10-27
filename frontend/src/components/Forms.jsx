import { useState, useRef } from 'react';
import { createSubmissionKey } from '../lib/submission';
import { Plus, ArrowRight, Send, Trash2, Check, CalendarDays } from 'lucide-react';
import { Modal, Spinner, Avatar, Priority } from './ui';
import { STATUSES, PRIORITIES, LABELS, recordId, dateLabel, timeAgo } from '../lib/domain';
export function ProjectForm({ onClose, onSave, onDelete, project }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [color, setColor] = useState(project?.color || 'violet'),
    [confirmDelete, setConfirmDelete] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        ...Object.fromEntries(new FormData(e.currentTarget)),
        color,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={project ? 'A little fine-tuning.' : 'Make space for a new idea.'}
      subtitle="Give your next great project a place to grow."
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <label>
          Project name
          <input
            data-autofocus
            name="name"
            required
            maxLength={100}
            defaultValue={project?.name}
            placeholder="Something worth building"
          />
        </label>
        <label>
          A little context
          <textarea
            name="description"
            maxLength={2000}
            defaultValue={project?.description}
            placeholder="What are we making, and why does it matter?"
            rows={3}
          />
        </label>
        <div className="form-two">
          <label>
            Target date
            <input type="date" name="dueDate" defaultValue={project?.dueDate?.slice(0, 10)} />
          </label>
          {project && (
            <label>
              Status
              <select name="status" defaultValue={project.status}>
                <option>Active</option>
                <option>Completed</option>
                <option>Archived</option>
              </select>
            </label>
          )}
        </div>
        <fieldset className="color-picker">
          <legend>Make it yours</legend>
          {['violet', 'lime', 'peach', 'blue'].map((c) => (
            <button
              type="button"
              aria-label={`${c} project color`}
              aria-pressed={c === color}
              key={c}
              className={`color-swatch color-${c} ${c === color ? 'selected' : ''}`}
              onClick={() => setColor(c)}
            >
              {c === color && <Check size={17} />}
            </button>
          ))}
        </fieldset>
        {project && onDelete && (
          <div className="danger-zone">
            {confirmDelete ? (
              <>
                <span>
                  Delete this project, its tasks, comments, and activity? This cannot be undone.
                </span>
                <button
                  type="button"
                  className="btn danger"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onDelete();
                      onClose();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Yes, delete project
                </button>
                <button type="button" className="text-link" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </button>
              </>
            ) : (
              <button
                type="button"
                className="text-link danger-text"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} />
                Delete project
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? <Spinner /> : <Plus size={16} />} {project ? 'Save changes' : 'Create project'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function TaskForm({ onClose, onSave, projects, projectId, task, status = 'Todo' }) {
  const submission = useRef(null);
  if (!submission.current) submission.current = createSubmissionKey();
  const [selected, setSelected] = useState(
      recordId(task?.project) ||
        projectId ||
        projects.find((p) => p.status === 'Active')?._id ||
        '',
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [assigned, setAssigned] = useState(recordId(task?.assignedTo) || '');
  const p = projects.find((p) => p._id === selected),
    people = p ? [p.owner, ...p.members] : [];
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      if (task) delete body.project;
      else body.clientRequestId = submission.current(body);
      await onSave(body);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={task ? 'A few thoughtful details.' : 'Small steps. Great things.'}
      subtitle={
        task ? 'Keep the context clear and the work moving.' : 'What’s the next thing worth doing?'
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <label>
          Task title
          <input
            data-autofocus
            name="title"
            required
            maxLength={160}
            defaultValue={task?.title}
            placeholder="Give the next step a name"
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={3}
            maxLength={4000}
            defaultValue={task?.description}
            placeholder="A little context goes a long way…"
          />
        </label>
        <label>
          Project
          <select
            name="project"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setAssigned('');
            }}
            disabled={!!task}
            required
          >
            <option value="" disabled>
              Select a project
            </option>
            {projects
              .filter((p) => p.status === 'Active' || p._id === selected)
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <div className="form-two">
          <label>
            Status
            <select name="status" defaultValue={task?.status || status}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" defaultValue={task?.priority || 'Medium'}>
              {PRIORITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-two">
          <label>
            Assignee
            <select
              name="assignedTo"
              value={assigned}
              onChange={(e) => setAssigned(e.target.value)}
            >
              <option value="">Unassigned</option>
              {people.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" name="dueDate" defaultValue={task?.dueDate?.slice(0, 10)} />
          </label>
        </div>
        <label>
          Category
          <select name="label" defaultValue={task?.label || 'Engineering'}>
            {LABELS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy || !selected}>
            {busy ? <Spinner /> : <ArrowRight size={16} />} {task ? 'Save changes' : 'Create task'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function TaskDetail({ task, onClose, onEdit, onMove, onComment, onDelete, user }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false);
  const canDelete =
    recordId(task.project?.owner) === user._id || recordId(task.createdBy) === user._id;
  async function comment(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      await onComment(task, new FormData(form).get('text'));
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={task.title} subtitle={task.project?.name} onClose={onClose} wide>
      <div className="task-detail">
        <div className="detail-actions">
          <span className={`label-tag label-${task.label.toLowerCase()}`}>{task.label}</span>
          <select
            aria-label="Task status"
            value={task.status}
            onChange={(e) => onMove(task, e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn secondary" onClick={() => onEdit(task)}>
            Edit task
          </button>
        </div>
        <p className="detail-description">
          {task.description || 'No description yet. Add a little context to help your team.'}
        </p>
        <div className="detail-properties">
          <div>
            <span>Assigned to</span>
            <b>
              {task.assignedTo ? (
                <>
                  <Avatar person={task.assignedTo} size="small" />
                  {task.assignedTo.name}
                </>
              ) : (
                'Unassigned'
              )}
            </b>
          </div>
          <div>
            <span>Priority</span>
            <Priority value={task.priority} />
          </div>
          <div>
            <span>Due date</span>
            <b>
              <CalendarDays size={14} />
              {dateLabel(task.dueDate)}
            </b>
          </div>
          <div>
            <span>Created by</span>
            <b>{task.createdBy?.name || 'Team member'}</b>
          </div>
        </div>
        <section className="comments">
          <h3>
            A little conversation <span>{task.comments?.length || 0}</span>
          </h3>
          {task.comments?.length ? (
            task.comments.map((c) => (
              <article key={c._id}>
                <Avatar person={c.author} size="small" />
                <div>
                  <b>{c.author?.name || 'Former teammate'}</b>
                  <time>{timeAgo(c.createdAt)}</time>
                  <p>{c.text}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">
              Share an update, ask a question, or leave a little encouragement.
            </p>
          )}
          <form onSubmit={comment}>
            <textarea
              name="text"
              aria-label="Write a comment"
              placeholder="Keep the conversation moving…"
              required
              maxLength={2000}
              rows={2}
            />
            <button className="btn primary" disabled={busy}>
              {busy ? <Spinner /> : <Send size={15} />}Post comment
            </button>
          </form>
        </section>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {canDelete && (
          <div className="danger-zone">
            {confirm ? (
              <>
                <span>Delete this task? This cannot be undone.</span>
                <button
                  className="btn danger"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onDelete(task);
                      onClose();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Yes, delete
                </button>
                <button className="text-link" onClick={() => setConfirm(false)}>
                  Keep it
                </button>
              </>
            ) : (
              <button className="text-link danger-text" onClick={() => setConfirm(true)}>
                <Trash2 size={14} />
                Delete task
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
export function InviteForm({ project, onClose, onSave }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <Modal
      title="Good work is a team sport."
      subtitle={`Invite an existing Orbit member to ${project.name}.`}
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave(new FormData(e.currentTarget).get('email'));
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Teammate’s email
          <input
            data-autofocus
            type="email"
            name="email"
            required
            placeholder="teammate@company.com"
          />
        </label>
        <p className="form-help">
          They’ll need an Orbit account first. Adding them gives access to this project’s tasks and
          activity. No email is sent.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? <Spinner /> : <Plus size={16} />}Add teammate
          </button>
        </footer>
      </form>
    </Modal>
  );
}
