import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import { Plus, GripVertical, MessageSquare, CalendarDays, ArrowUpRight, Check } from 'lucide-react';
import { STATUSES, dateLabel, isOverdue } from '../lib/domain';
import { Avatar, Priority, StatusBadge, Empty } from './ui';
export function TaskCard({ task, onOpen, drag = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task._id,
    disabled: !drag,
  });
  return (
    <article ref={setNodeRef} className={`task-card ${isDragging ? 'is-dragging' : ''}`}>
      <div className="task-card-top">
        <span className={`label-tag label-${task.label.toLowerCase()}`}>{task.label}</span>
        {drag ? (
          <button
            className="drag-handle"
            aria-label={`Drag ${task.title}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical size={16} />
          </button>
        ) : (
          <ArrowUpRight size={15} />
        )}
      </div>
      <button className="task-title" onClick={() => onOpen(task)}>
        {task.title}
      </button>
      <p>{task.description}</p>
      <div className="task-card-meta">
        <Priority value={task.priority} />
        <span className={isOverdue(task) ? 'overdue' : ''}>
          <CalendarDays size={13} />
          {task.dueDate ? dateLabel(task.dueDate) : 'No date'}
        </span>
      </div>
      <footer>
        <span className="task-comments">
          <MessageSquare size={14} />
          {task.comments?.length || 0}
        </span>
        {task.assignedTo ? (
          <Avatar person={task.assignedTo} size="small" index={task.assignedTo.name.length} />
        ) : (
          <span className="unassigned">Unassigned</span>
        )}
      </footer>
    </article>
  );
}
function Column({ status, tasks, onOpen, onCreate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  return (
    <section
      ref={setNodeRef}
      className={`board-column ${isOver ? 'drag-over' : ''}`}
      aria-label={`${status} column`}
    >
      <header>
        <h3>
          <span className={`column-dot dot-${status.replaceAll(' ', '-').toLowerCase()}`} />
          {status === 'Todo' ? 'To do' : status}
          <span className="count">{tasks.length}</span>
        </h3>
        <button
          className="icon-button"
          aria-label={`Add task to ${status}`}
          onClick={() => onCreate(status)}
        >
          <Plus size={17} />
        </button>
      </header>
      <div className="column-cards">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onOpen={onOpen} drag />
        ))}
        {!tasks.length && <div className="column-empty">A little room for what’s next.</div>}
        <button className="add-task-inline" onClick={() => onCreate(status)}>
          <Plus size={16} />
          Add task
        </button>
      </div>
    </section>
  );
}
export function TaskBoard({ tasks, onOpen, onCreate, onMove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const [dragged, setDragged] = useState(null);
  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDragged(tasks.find((t) => t._id === e.active.id))}
      onDragCancel={() => setDragged(null)}
      onDragEnd={({ active, over }) => {
        setDragged(null);
        const t = tasks.find((t) => t._id === active.id);
        if (t && over && STATUSES.includes(over.id) && t.status !== over.id) onMove(t, over.id);
      }}
    >
      <div className="kanban-board">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onOpen={onOpen}
            onCreate={onCreate}
          />
        ))}
      </div>
      <DragOverlay>
        {dragged && (
          <div className="drag-preview">
            <span className={`label-tag label-${dragged.label.toLowerCase()}`}>
              {dragged.label}
            </span>
            <b>{dragged.title}</b>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
export function TaskTable({ tasks, onOpen, onMove, compact = false }) {
  if (!tasks.length)
    return (
      <Empty
        title="Nothing on the list. Everything is possible."
        text="Create a task or try a different filter."
      />
    );
  return (
    <div className="table-scroll">
      <table className={`task-table ${compact ? 'compact' : ''}`}>
        <thead>
          <tr>
            <th>Task name</th>
            {!compact && <th>Project</th>}
            <th>Status</th>
            <th>Priority</th>
            <th>Due date</th>
            <th>
              <span className="sr-only">Assignee</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t._id}>
              <td>
                <div className="task-cell">
                  <button
                    className={`task-check ${t.status === 'Done' ? 'checked' : ''}`}
                    aria-label={t.status === 'Done' ? `Reopen ${t.title}` : `Complete ${t.title}`}
                    onClick={() => onMove(t, t.status === 'Done' ? 'Todo' : 'Done')}
                  >
                    {t.status === 'Done' && <Check size={12} />}
                  </button>
                  <button
                    className={`table-task-title ${t.status === 'Done' ? 'completed' : ''}`}
                    onClick={() => onOpen(t)}
                  >
                    {t.title}
                  </button>
                </div>
              </td>
              {!compact && (
                <td>
                  <span className="project-cell">
                    <i className={`color-${t.project?.color}`} />
                    {t.project?.name}
                  </span>
                </td>
              )}
              <td>
                <StatusBadge status={t.status} />
              </td>
              <td>
                <Priority value={t.priority} />
              </td>
              <td className={isOverdue(t) ? 'overdue' : ''}>{dateLabel(t.dueDate)}</td>
              <td>
                {t.assignedTo ? (
                  <Avatar person={t.assignedTo} size="small" index={t.assignedTo.name.length} />
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
