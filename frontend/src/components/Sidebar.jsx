import {
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  MoreHorizontal,
  Settings,
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Activity,
} from 'lucide-react';
import { Brand, Avatar, IconButton } from './ui';
import FocusTimer from './FocusTimer';
const nav = [
  ['overview', 'Overview', LayoutDashboard],
  ['projects', 'Projects', FolderOpen],
  ['tasks', 'My tasks', CheckSquare],
  ['activity', 'Activity', Activity],
];
export default function Sidebar({
  mobile,
  narrow,
  user,
  view,
  projects,
  projectId,
  stats,
  navigate,
  openProject,
  create,
  setModal,
  setCommand,
  setQuery,
}) {
  return (
    <aside
      className={`sidebar ${mobile ? 'mobile-open' : ''}`}
      inert={narrow && !mobile ? true : undefined}
      aria-hidden={narrow && !mobile ? true : undefined}
    >
      <div className="sidebar-brand">
        <Brand />
        <span className="workspace-badge">WORKSPACE</span>
      </div>
      <button
        className="workspace-select"
        onClick={() =>
          setModal({
            type: 'workspace',
          })
        }
      >
        <span className="workspace-icon">
          o<span>✳</span>
        </span>
        <span>
          <b>{user.demo ? 'The creative space' : 'My workspace'}</b>
          <small>{user.demo ? 'Demo workspace' : 'Personal workspace'}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      <button
        className="sidebar-search"
        onClick={() => {
          setQuery('');
          setCommand(true);
        }}
      >
        <Search size={16} />
        <span>Find your way</span>
        <kbd>⌘ K</kbd>
      </button>
      <div className="nav-caption">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">
        {nav.map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${view === id ? 'active' : ''}`}
            onClick={() => navigate(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={1.7} />
            <span>{label}</span>
            {id === 'tasks' && stats.mine > 0 && <span className="nav-counter">{stats.mine}</span>}
            {id === 'overview' && view === id && <span className="active-spark">✳</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-project-heading">
        <span>IN YOUR ORBIT</span>
        <IconButton label="Create project" onClick={() => create('project')}>
          <Plus size={16} />
        </IconButton>
      </div>
      <div className="sidebar-projects">
        {projects
          .filter((p) => p.status === 'Active')
          .map((p) => (
            <button
              key={p._id}
              onClick={() => openProject(p)}
              className={projectId === p._id ? 'selected' : ''}
            >
              <span className={`project-dot color-${p.color}`} />
              <span>{p.name}</span>
              <ChevronRight size={13} />
            </button>
          ))}
        {!projects.length && <p>Your next great idea goes here.</p>}
      </div>
      <div className="sidebar-bottom">
        <FocusTimer />
        <button
          className={`nav-item ${view === 'settings' ? 'active' : ''}`}
          onClick={() => navigate('settings')}
        >
          <Settings size={18} />
          <span>Workspace settings</span>
        </button>
        <button
          className="profile-button"
          onClick={() =>
            setModal({
              type: 'profile',
            })
          }
        >
          <Avatar person={user} index={0} />
          <span>
            <b>{user.name}</b>
            <small>
              {user.demo ? 'Exploring the possibilities' : 'Member · Personal workspace'}
            </small>
          </span>
          <MoreHorizontal size={17} />
        </button>
      </div>
    </aside>
  );
}
