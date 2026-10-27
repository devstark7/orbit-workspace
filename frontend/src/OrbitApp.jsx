import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MotionConfig } from 'motion/react';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Activity,
  Settings,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Command,
  Bell,
  Menu,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Download,
  LogOut,
  Sparkles,
  Users,
  CalendarDays,
  MoreHorizontal,
  RefreshCw,
  Check,
  Trash2,
  ShieldCheck,
  Sun,
  Moon,
  HelpCircle,
  Keyboard,
  ExternalLink,
} from 'lucide-react';
import { api } from './lib/api';
import { filterTasks, summarize, recordId, dateLabel, csvExport, isOverdue } from './lib/domain';
import {
  Brand,
  Avatar,
  AvatarGroup,
  IconButton,
  Spinner,
  Modal,
  Toast,
  Empty,
  PageMotion,
  ArrowLink,
} from './components/ui';
import AuthScreen from './components/AuthScreen';
import Overview, { ProjectCard, ActivityFeed } from './components/Overview';
import { TaskBoard, TaskTable } from './components/TaskBoard';
import { ProjectForm, TaskForm, TaskDetail, InviteForm } from './components/Forms';
import FocusTimer from './components/FocusTimer';

const nav = [
  ['overview', 'Overview', LayoutDashboard],
  ['projects', 'Projects', FolderOpen],
  ['tasks', 'My tasks', CheckSquare],
  ['activity', 'Activity', Activity],
];
const readSetting = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem('orbit.' + key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export default function App() {
  const [user, setUser] = useState(null),
    [booting, setBooting] = useState(true),
    [loading, setLoading] = useState(true),
    [data, setData] = useState({ projects: [], tasks: [], activity: [] }),
    [loadError, setLoadError] = useState('');
  const [view, setView] = useState('overview'),
    [projectId, setProjectId] = useState(null),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(null),
    [mobile, setMobile] = useState(false),
    [command, setCommand] = useState(false),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState(''),
    [layout, setLayout] = useState('board'),
    [priority, setPriority] = useState('All'),
    [status, setStatus] = useState('All'),
    [overdueOnly, setOverdueOnly] = useState(false),
    [taskScope, setTaskScope] = useState('mine'),
    [projectFilter, setProjectFilter] = useState('All'),
    [reduced, setReduced] = useState(() => readSetting('reduced', false)),
    [compact, setCompact] = useState(() => readSetting('compact', false));
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width:760px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width:760px)');
    const update = () => {
      setNarrow(media.matches);
      if (!media.matches) setMobile(false);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const request = useRef(0),
    busyMove = useRef(new Set());
  const showToast = useCallback(
      (message, error = false) => setToast({ message, error, id: Date.now() }),
      [],
    ),
    clearToast = useCallback(() => setToast(null), []);
  useEffect(() => {
    api('/auth/me')
      .then(setUser)
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    try {
      const [projects, tasks, activity] = await Promise.all([
        api('/projects'),
        api('/tasks'),
        api('/activity'),
      ]);
      if (current === request.current) {
        setData({ projects, tasks, activity });
        setLoadError('');
      }
    } catch (e) {
      if (current === request.current) {
        if (e.status === 401) {
          setUser(null);
          setData({ projects: [], tasks: [], activity: [] });
        } else setLoadError(e.message);
      }
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (user) refresh();
  }, [user?._id, refresh]);
  const navigate = useCallback((next, filters = {}) => {
    setView(next);
    setProjectId(null);
    setMobile(false);
    setSearch('');
    setStatus(filters.status || 'All');
    setOverdueOnly(!!filters.overdue);
    setTaskScope(filters.scope || 'mine');
    if (filters.status || filters.overdue) setLayout('list');
    setPriority('All');
    setProjectFilter('All');
  }, []);
  const openProject = useCallback((p) => {
    setProjectId(p._id);
    setView('project');
    setMobile(false);
    setSearch('');
    setStatus('All');
    setOverdueOnly(false);
    setPriority('All');
  }, []);
  const create = useCallback(
    (type, extra = {}) => {
      if (type === 'task' && !data.projects.some((p) => p.status === 'Active')) {
        showToast('Create an active project first.');
        setModal({ type: 'project' });
      } else setModal({ type, ...extra });
    },
    [data.projects, showToast],
  );
  useEffect(() => {
    function key(e) {
      const editing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
        document.activeElement?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!modal) setCommand((v) => !v);
      }
      if (!editing && !modal && !command && user) {
        if (e.key === 'n') {
          e.preventDefault();
          create('task');
        }
        if (e.key === 'Escape') setMobile(false);
      }
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [user, modal, command, create]);
  async function mutate(path, method, body, message) {
    const result = await api(path, { method, body });
    await refresh();
    if (message) showToast(message);
    return result;
  }
  async function moveTask(task, next) {
    if (busyMove.current.has(task._id)) return;
    busyMove.current.add(task._id);
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t._id === task._id
          ? { ...t, status: next, completedAt: next === 'Done' ? new Date().toISOString() : null }
          : t,
      ),
    }));
    try {
      await mutate(
        '/tasks/' + task._id,
        'PATCH',
        { status: next },
        next === 'Done' ? 'One more good thing, done.' : 'Task moved. Keep it flowing.',
      );
    } catch (e) {
      await refresh();
      showToast(e.message, true);
    } finally {
      busyMove.current.delete(task._id);
    }
  }
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST', body: {} });
      request.current++;
      setUser(null);
      setData({ projects: [], tasks: [], activity: [] });
      navigate('overview');
      setModal(null);
    } catch (e) {
      showToast(e.message, true);
    }
  }
  function exportTasks() {
    const blob = new Blob(['\uFEFF' + csvExport(visibleTasks)], { type: 'text/csv;charset=utf-8' }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'orbit-tasks.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('A little clarity, exported.');
  }
  const { projects, tasks, activity } = data,
    project = projects.find((p) => p._id === projectId),
    stats = summarize(tasks, user?._id);
  const projectTasks = tasks.filter((t) => recordId(t.project) === projectId);
  const visibleTasks = filterTasks(view === 'project' ? projectTasks : tasks, {
    query: search,
    status,
    priority,
    mine: view === 'tasks' && taskScope === 'mine',
    userId: user?._id,
  }).filter((t) => !overdueOnly || isOverdue(t));
  const selectedTask = modal?.taskId ? tasks.find((t) => t._id === modal.taskId) : null;
  const filteredProjects = projects.filter(
    (p) =>
      (projectFilter === 'All' || p.status === projectFilter) &&
      (!search ||
        [p.name, p.description].some((v) => v?.toLowerCase().includes(search.toLowerCase()))),
  );
  const commandTasks = filterTasks(tasks, { query }).slice(0, 5),
    commandProjects = projects
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);
  const onTask = (t) => setModal({ type: 'detail', taskId: t._id });
  const isOwner = project && recordId(project.owner) === user?._id;
  if (booting)
    return (
      <div className="boot-screen">
        <Brand />
        <Spinner />
        <p>Finding your orbit…</p>
      </div>
    );
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      {!user ? (
        <AuthScreen
          onAuth={(u) => {
            setLoading(true);
            setUser(u);
            navigate('overview');
          }}
        />
      ) : (
        <div
          className={`app-shell ${compact ? 'compact-mode' : ''} ${reduced ? 'reduced-motion' : ''}`}
        >
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {mobile && (
            <button
              className="mobile-scrim"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            />
          )}
          <aside
            className={`sidebar ${mobile ? 'mobile-open' : ''}`}
            inert={narrow && !mobile ? true : undefined}
            aria-hidden={narrow && !mobile ? true : undefined}
          >
            <div className="sidebar-brand">
              <Brand />
              <span className="workspace-badge">WORKSPACE</span>
            </div>
            <button className="workspace-select" onClick={() => setModal({ type: 'workspace' })}>
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
                  {id === 'tasks' && stats.mine > 0 && (
                    <span className="nav-counter">{stats.mine}</span>
                  )}
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
              <button className="profile-button" onClick={() => setModal({ type: 'profile' })}>
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
          <div className="workspace-main">
            <header className="topbar">
              <div className="breadcrumbs">
                <IconButton label="Open navigation" onClick={() => setMobile(!mobile)}>
                  <Menu size={20} />
                </IconButton>
                <span className="breadcrumb-home">Workspace</span>
                <ChevronRight size={13} />
                <span>
                  {view === 'project'
                    ? project?.name || 'Project'
                    : view === 'overview'
                      ? 'Overview'
                      : view === 'tasks'
                        ? 'My tasks'
                        : view === 'settings'
                          ? 'Settings'
                          : view === 'projects'
                            ? 'Projects'
                            : 'Activity'}
                </span>
              </div>
              <div className="topbar-right">
                <span className="today-date">
                  <CalendarDays size={14} />
                  {new Date().toLocaleDateString('en', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {user.demo && (
                  <span className="demo-badge">
                    <span />
                    Demo mode
                  </span>
                )}
                <IconButton
                  label="Open command palette"
                  onClick={() => {
                    setQuery('');
                    setCommand(true);
                  }}
                >
                  <Search size={18} />
                </IconButton>
                <IconButton label="View latest activity" onClick={() => navigate('activity')}>
                  <Bell size={18} />
                  {activity.length > 0 && <span className="notification-dot" />}
                </IconButton>
                <span className="topbar-separator" />
                <button
                  className="topbar-avatar"
                  aria-label="Open your profile"
                  onClick={() => setModal({ type: 'profile' })}
                >
                  <Avatar person={user} size="small" />
                </button>
              </div>
            </header>
            <main id="main-content" className="main-content" tabIndex={-1}>
              {loadError && (
                <div className="load-error" role="alert">
                  <span>{loadError}</span>
                  <button onClick={refresh}>
                    <RefreshCw size={14} />
                    Try again
                  </button>
                </div>
              )}
              {loading && !projects.length ? (
                <div className="workspace-loading">
                  <Spinner />
                  <p>Making a little space for your work…</p>
                </div>
              ) : (
                <PageMotion key={view + (projectId || '')}>
                  {view === 'overview' && (
                    <Overview
                      user={user}
                      {...data}
                      onProject={openProject}
                      onCreate={create}
                      onTask={onTask}
                      onMove={moveTask}
                      onNavigate={navigate}
                    />
                  )}{' '}
                  {view === 'projects' && (
                    <>
                      <div className="page-intro">
                        <div>
                          <span className="eyebrow">ROOM FOR YOUR NEXT BIG THING</span>
                          <h1>
                            A world of possibility<span className="greeting-sun">✳</span>
                          </h1>
                          <p>Good ideas deserve a place to grow. Here’s yours.</p>
                        </div>
                        <button className="btn primary" onClick={() => create('project')}>
                          <Plus size={17} />
                          New project
                        </button>
                      </div>
                      <div className="collection-toolbar">
                        <div className="segmented">
                          {['All', 'Active', 'Completed', 'Archived'].map((s) => (
                            <button
                              className={projectFilter === s ? 'active' : ''}
                              onClick={() => setProjectFilter(s)}
                              key={s}
                            >
                              {s}
                              <span>
                                {projects.filter((p) => s === 'All' || p.status === s).length}
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="input-search">
                          <Search size={16} />
                          <input
                            aria-label="Search projects"
                            placeholder="Find a project…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      {filteredProjects.length ? (
                        <div className="project-grid all-projects">
                          {filteredProjects.map((p, i) => (
                            <ProjectCard
                              key={p._id}
                              project={p}
                              tasks={tasks}
                              onOpen={openProject}
                              index={i}
                            />
                          ))}
                          <button className="new-project-card" onClick={() => create('project')}>
                            <span>
                              <Plus size={25} />
                            </span>
                            <b>What’s next?</b>
                            <p>Make space for a new project.</p>
                          </button>
                        </div>
                      ) : (
                        <Empty
                          title="A clean slate."
                          text="Create a project, or try a different filter."
                          action={
                            <button className="btn primary" onClick={() => create('project')}>
                              <Plus size={16} />
                              Create project
                            </button>
                          }
                        />
                      )}
                    </>
                  )}
                  {(view === 'tasks' || view === 'project') && (
                    <>
                      {view === 'project' && (
                        <button className="back-link" onClick={() => navigate('projects')}>
                          <ArrowLeft size={14} />
                          All projects
                        </button>
                      )}
                      <div className="page-intro">
                        <div>
                          <span className="eyebrow">
                            {view === 'project'
                              ? 'A SHARED DIRECTION'
                              : 'A LITTLE FOCUS GOES A LONG WAY'}
                          </span>
                          <h1>
                            {view === 'project'
                              ? project?.name || 'Project not found'
                              : 'Your next great steps'}
                            <span className="greeting-sun">✳</span>
                          </h1>
                          <p>
                            {view === 'project'
                              ? project?.description
                              : 'One thoughtful task at a time. You’ve got this.'}
                          </p>
                        </div>
                        <div className="intro-buttons">
                          {view === 'project' && isOwner && (
                            <IconButton
                              label="Edit project"
                              onClick={() => setModal({ type: 'editProject' })}
                            >
                              <MoreHorizontal size={21} />
                            </IconButton>
                          )}
                          <button
                            className="btn primary"
                            disabled={view === 'project' && project?.status !== 'Active'}
                            onClick={() => create('task', { projectId: projectId || undefined })}
                          >
                            <Plus size={17} />
                            New task
                          </button>
                        </div>
                      </div>
                      {view === 'project' && project && (
                        <div className="project-meta">
                          <AvatarGroup people={[project.owner, ...project.members]} />
                          <span>{project.members.length + 1} teammates</span>
                          {isOwner && (
                            <button
                              className="text-link"
                              onClick={() => setModal({ type: 'invite' })}
                            >
                              <Plus size={14} />
                              Add teammate
                            </button>
                          )}
                          <span className="meta-divider" />
                          <span>
                            <CalendarDays size={14} />
                            {dateLabel(project.dueDate)}
                          </span>
                          <span className="project-status">
                            <i />
                            {project.status}
                          </span>
                        </div>
                      )}
                      <div className="task-toolbar">
                        <div className="toolbar-left">
                          {view === 'tasks' && (
                            <div className="segmented">
                              <button
                                className={taskScope === 'mine' ? 'active' : ''}
                                onClick={() => setTaskScope('mine')}
                              >
                                Assigned to me
                              </button>
                              <button
                                className={taskScope === 'all' ? 'active' : ''}
                                onClick={() => setTaskScope('all')}
                              >
                                All tasks
                              </button>
                            </div>
                          )}
                          <div className="view-toggle">
                            <button
                              aria-label="Board view"
                              aria-pressed={layout === 'board'}
                              className={layout === 'board' ? 'active' : ''}
                              onClick={() => {
                                setLayout('board');
                                setStatus('All');
                              }}
                            >
                              <LayoutGrid size={16} />
                              <span>Board</span>
                            </button>
                            <button
                              aria-label="List view"
                              aria-pressed={layout === 'list'}
                              className={layout === 'list' ? 'active' : ''}
                              onClick={() => setLayout('list')}
                            >
                              <List size={17} />
                              <span>List</span>
                            </button>
                          </div>
                        </div>
                        <div className="toolbar-filters">
                          {overdueOnly && (
                            <button className="btn secondary" onClick={() => setOverdueOnly(false)}>
                              Overdue only <X size={13} />
                            </button>
                          )}
                          <div className="input-search">
                            <Search size={15} />
                            <input
                              aria-label="Search tasks"
                              placeholder="Find a task…"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </div>
                          <select
                            aria-label="Filter priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                          >
                            <option value="All">All priorities</option>
                            {['High', 'Medium', 'Low'].map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                          {layout === 'list' && (
                            <select
                              aria-label="Filter status"
                              value={status}
                              onChange={(e) => setStatus(e.target.value)}
                            >
                              <option value="All">All statuses</option>
                              {['Todo', 'In Progress', 'Done'].map((p) => (
                                <option key={p}>{p}</option>
                              ))}
                            </select>
                          )}
                          <IconButton label="Export filtered tasks to CSV" onClick={exportTasks}>
                            <Download size={16} />
                          </IconButton>
                        </div>
                      </div>
                      {layout === 'board' ? (
                        <TaskBoard
                          tasks={visibleTasks}
                          onOpen={onTask}
                          onCreate={(s) =>
                            create('task', { projectId: projectId || undefined, status: s })
                          }
                          onMove={moveTask}
                        />
                      ) : (
                        <section className="panel">
                          <TaskTable tasks={visibleTasks} onOpen={onTask} onMove={moveTask} />
                        </section>
                      )}
                      <div className="board-footnote">
                        <span>{visibleTasks.length} tasks in view</span>
                        <span>
                          Drag a card to move it. Open a task to edit its status with your keyboard.
                        </span>
                      </div>
                    </>
                  )}
                  {view === 'activity' && (
                    <>
                      <div className="page-intro">
                        <div>
                          <span className="eyebrow">THE STORY OF YOUR WORK</span>
                          <h1>
                            A little more in sync<span className="greeting-sun">✳</span>
                          </h1>
                          <p>The small moves that make big things happen. Latest 40 updates.</p>
                        </div>
                        <button className="btn secondary" onClick={refresh} disabled={loading}>
                          <RefreshCw size={16} className={loading ? 'spin' : ''} />
                          Refresh
                        </button>
                      </div>
                      <section className="panel activity-full">
                        <div className="section-heading">
                          <h2>In your orbit</h2>
                          <span className="live-label">
                            <span />
                            Workspace activity
                          </span>
                        </div>
                        <ActivityFeed activity={activity} />
                      </section>
                    </>
                  )}
                  {view === 'settings' && (
                    <>
                      <div className="page-intro">
                        <div>
                          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
                          <h1>
                            Your space, your rhythm<span className="greeting-sun">✳</span>
                          </h1>
                          <p>A few thoughtful details to make Orbit feel like you.</p>
                        </div>
                      </div>
                      <div className="settings-grid">
                        <section className="panel settings-panel">
                          <h2>A little about you</h2>
                          <div className="settings-profile">
                            <Avatar person={user} />
                            <div>
                              <b>{user.name}</b>
                              <span>{user.demo ? 'Private demo session' : user.email}</span>
                            </div>
                            <span className="role-pill">Member</span>
                          </div>
                          <div className="setting-row">
                            <div>
                              <h3>Session privacy</h3>
                              <p>
                                Your sign-in uses an HTTP-only cookie. Project access is checked on
                                the server.
                              </p>
                            </div>
                            <ShieldCheck size={22} />
                          </div>
                          {user.demo && (
                            <p className="demo-note">
                              This demo is just for you. It uses fictional teammates and expires
                              after 24 hours. A temporary local database resets when the server
                              stops.
                            </p>
                          )}
                          <button className="btn secondary" onClick={logout}>
                            <LogOut size={16} />
                            Sign out
                          </button>
                        </section>
                        <section className="panel settings-panel">
                          <h2>Find your comfortable</h2>
                          <div className="setting-row">
                            <div>
                              <h3>Less motion</h3>
                              <p>Keep transitions quiet and the workspace still.</p>
                            </div>
                            <button
                              role="switch"
                              aria-checked={reduced}
                              aria-label="Reduce motion"
                              className={`toggle ${reduced ? 'on' : ''}`}
                              onClick={() => {
                                localStorage.setItem('orbit.reduced', JSON.stringify(!reduced));
                                setReduced(!reduced);
                              }}
                            >
                              <span />
                            </button>
                          </div>
                          <div className="setting-row">
                            <div>
                              <h3>A little more compact</h3>
                              <p>Give more tasks a place on your screen.</p>
                            </div>
                            <button
                              role="switch"
                              aria-checked={compact}
                              aria-label="Compact layout"
                              className={`toggle ${compact ? 'on' : ''}`}
                              onClick={() => {
                                localStorage.setItem('orbit.compact', JSON.stringify(!compact));
                                setCompact(!compact);
                              }}
                            >
                              <span />
                            </button>
                          </div>
                          <div className="keyboard-help">
                            <Keyboard size={18} />
                            <span>Your next step is a shortcut away.</span>
                            <dl>
                              <dt>Find anything</dt>
                              <dd>
                                <kbd>Ctrl / ⌘</kbd>
                                <kbd>K</kbd>
                              </dd>
                              <dt>New task</dt>
                              <dd>
                                <kbd>N</kbd>
                              </dd>
                              <dt>Close dialog</dt>
                              <dd>
                                <kbd>Esc</kbd>
                              </dd>
                            </dl>
                          </div>
                        </section>
                      </div>
                    </>
                  )}
                </PageMotion>
              )}
            </main>
          </div>
        </div>
      )}
      <Toast toast={toast} onClose={clearToast} />
      {user && modal?.type === 'project' && (
        <ProjectForm
          onClose={() => setModal(null)}
          onSave={(body) => mutate('/projects', 'POST', body, 'A new idea has a home.')}
        />
      )}{' '}
      {user && modal?.type === 'editProject' && project && (
        <ProjectForm
          project={project}
          onDelete={async () => {
            await mutate('/projects/' + project._id, 'DELETE', undefined, 'Project deleted.');
            navigate('projects');
          }}
          onClose={() => setModal(null)}
          onSave={(body) => mutate('/projects/' + project._id, 'PATCH', body, 'Project updated.')}
        />
      )}{' '}
      {user && modal?.type === 'task' && (
        <TaskForm
          projects={projects}
          projectId={modal.projectId}
          status={modal.status}
          onClose={() => setModal(null)}
          onSave={(body) => mutate('/tasks', 'POST', body, 'Your next step is ready.')}
        />
      )}{' '}
      {user && modal?.type === 'editTask' && selectedTask && (
        <TaskForm
          projects={projects}
          task={selectedTask}
          onClose={() => setModal(null)}
          onSave={(body) =>
            mutate('/tasks/' + selectedTask._id, 'PATCH', body, 'A little clearer. Task updated.')
          }
        />
      )}{' '}
      {user && modal?.type === 'detail' && selectedTask && (
        <TaskDetail
          task={selectedTask}
          user={user}
          onClose={() => setModal(null)}
          onEdit={(t) => setModal({ type: 'editTask', taskId: t._id })}
          onMove={moveTask}
          onComment={(t, text) =>
            mutate(
              '/tasks/' + t._id + '/comments',
              'POST',
              { text },
              'Your voice is in the conversation.',
            )
          }
          onDelete={(t) => mutate('/tasks/' + t._id, 'DELETE', undefined, 'Task deleted.')}
        />
      )}{' '}
      {user && modal?.type === 'invite' && project && (
        <InviteForm
          project={project}
          onClose={() => setModal(null)}
          onSave={(email) =>
            mutate(
              '/projects/' + project._id + '/members',
              'POST',
              { email },
              'A little better, together.',
            )
          }
        />
      )}{' '}
      {user && ['profile', 'workspace'].includes(modal?.type) && (
        <Modal
          title={modal.type === 'profile' ? 'A little about you.' : 'Your creative space.'}
          onClose={() => setModal(null)}
        >
          <div className="profile-modal">
            <Avatar person={user} />
            <h3>{user.name}</h3>
            <p>
              {user.demo
                ? 'You’re exploring a private demo. All names and projects are fictional.'
                : user.email}
            </p>
            <div className="profile-numbers">
              <span>
                <b>{projects.length}</b>Projects
              </span>
              <span>
                <b>{stats.done}</b>Tasks completed
              </span>
            </div>
            <button
              className="btn primary"
              onClick={() => {
                setModal(null);
                navigate('settings');
              }}
            >
              <Settings size={16} />
              Workspace settings
            </button>
            <button className="btn secondary" onClick={logout}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </Modal>
      )}
      {user && command && (
        <Modal title="Find your way." onClose={() => setCommand(false)}>
          <div className="command-palette">
            <div className="command-input">
              <Search size={19} />
              <input
                data-autofocus
                aria-label="Search workspace"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Projects, tasks, a little inspiration…"
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
      )}
    </MotionConfig>
  );
}
