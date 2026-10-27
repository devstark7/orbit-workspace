import { Search, Plus, FolderOpen, ArrowUpRight, CheckSquare } from 'lucide-react';
import { Modal, Empty } from './ui';
export default function CommandPalette({
  query,
  setQuery,
  setCommand,
  commandProjects,
  commandTasks,
  create,
  openProject,
  onTask,
}) {
  return (
    <Modal title="Find your way." onClose={() => setCommand(false)}>
      <div className="command-palette">
        <div className="command-input">
          <Search size={19} />
          <input
            data-autofocus
            aria-label="Search workspace"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and tasks…"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-results">
          {!query && (
            <>
              <span className="eyebrow">QUICK MOVES</span>
              <button
                onClick={() => {
                  setCommand(false);
                  create('task');
                }}
              >
                <Plus size={17} />
                Create a task<kbd>N</kbd>
              </button>
              <button
                onClick={() => {
                  setCommand(false);
                  create('project');
                }}
              >
                <FolderOpen size={17} />
                Start a project
                <ArrowUpRight size={15} />
              </button>
            </>
          )}
          {commandProjects.length > 0 && <span className="eyebrow">PROJECTS</span>}
          {commandProjects.map((p) => (
            <button
              key={p._id}
              onClick={() => {
                setCommand(false);
                openProject(p);
              }}
            >
              <i className={`project-dot color-${p.color}`} />
              {p.name}
              <ArrowUpRight size={15} />
            </button>
          ))}
          {commandTasks.length > 0 && <span className="eyebrow">TASKS</span>}
          {commandTasks.map((t) => (
            <button
              key={t._id}
              onClick={() => {
                setCommand(false);
                onTask(t);
              }}
            >
              <CheckSquare size={17} />
              <span>
                {t.title}
                <small>{t.project?.name}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
          {!commandProjects.length && !commandTasks.length && (
            <Empty
              title="A little off the beaten path."
              text="Try another search, or create something new."
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
