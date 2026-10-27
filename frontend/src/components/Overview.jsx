import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  FolderOpen,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Orbit,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarGroup, ArrowLink, Empty } from './ui';
import { TaskTable } from './TaskBoard';
import { summarize, recordId, completionSeries, dateLabel, timeAgo } from '../lib/domain';
export function ProjectCard({ project, tasks, onOpen, index = 0 }) {
  const related = tasks.filter((t) => recordId(t.project) === project._id),
    stats = summarize(related);
  return (
    <motion.button
      className={`project-card project-${project.color}`}
      onClick={() => onOpen(project)}
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.22,
      }}
    >
      <div className="project-top">
        <span className={`project-icon color-${project.color}`}>
          <FolderOpen size={20} strokeWidth={1.6} />
        </span>
        <span className="project-date">
          {project.dueDate ? dateLabel(project.dueDate) : 'No target date'}
        </span>
        <ArrowUpRight size={19} />
      </div>
      <h3>{project.name}</h3>
      <p>{project.description || 'A little space for your next great idea.'}</p>
      <div className="project-progress-label">
        <span>
          {stats.done} of {stats.total} tasks
        </span>
        <b>{stats.percent}%</b>
      </div>
      <div className="progress-track">
        <motion.span
          initial={{
            width: 0,
          }}
          animate={{
            width: stats.percent + '%',
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.12,
          }}
        />
      </div>
      <footer>
        <AvatarGroup people={[project.owner, ...project.members]} />
        <span>
          {project.status === 'Active' ? 'In motion' : project.status}
          <i />
        </span>
      </footer>
    </motion.button>
  );
}
export function ActivityFeed({ activity, compact = false }) {
  return activity.length ? (
    <div className={`activity-feed ${compact ? 'compact' : ''}`}>
      {activity.slice(0, compact ? 4 : 40).map((a) => (
        <article key={a._id}>
          <Avatar person={a.actor} size="small" index={a.actor?.name?.length || 0} />
          <div>
            <p>
              <b>{a.actor?.name?.split(' ')[0] || 'A teammate'}</b> {a.action}
            </p>
            <span>{a.subject}</span>
            <time>
              {timeAgo(a.createdAt)}
              {!compact && a.project?.name ? ' · ' + a.project.name : ''}
            </time>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <Empty title="The story starts here." text="Your team’s latest moves will appear here." />
  );
}
export default function Overview({
  user,
  projects,
  tasks,
  activity,
  onProject,
  onCreate,
  onTask,
  onMove,
  onNavigate,
}) {
  const [range, setRange] = useState(7);
  const stats = summarize(tasks, user._id),
    series = completionSeries(tasks, range),
    max = Math.max(3, ...series.map((d) => d.value));
  const mine = tasks
    .filter((t) => recordId(t.assignedTo) === user._id && t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999'))
    .slice(0, 4);
  const firstName = user.name.split(' ')[0],
    hour = new Date().getHours(),
    greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const cards = [
    {
      label: 'Total projects',
      value: projects.length,
      caption: projects.filter((p) => p.status === 'Active').length + ' in motion',
      icon: FolderOpen,
      color: 'violet',
      view: 'projects',
    },
    {
      label: 'Tasks completed',
      value: stats.done,
      caption: stats.percent + '% of all work',
      icon: CheckCircle2,
      color: 'lime',
      view: 'tasks',
      filters: {
        status: 'Done',
        scope: 'all',
      },
    },
    {
      label: 'In progress',
      value: stats.progress,
      caption: 'Good things take shape',
      icon: Clock3,
      color: 'peach',
      view: 'tasks',
      filters: {
        status: 'In Progress',
        scope: 'all',
      },
    },
    {
      label: 'Needs attention',
      value: stats.overdue,
      caption: stats.overdue ? 'Past their due date' : 'Everything on track',
      icon: TrendingUp,
      color: 'blue',
      view: 'tasks',
      filters: {
        overdue: true,
        scope: 'all',
      },
    },
  ];
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">A LITTLE CLARITY FOR YOUR DAY</div>
          <h1>
            {greeting}, {firstName}
            <span className="greeting-sun">✳</span>
          </h1>
          <p>Make space for what matters. Let’s move good work forward.</p>
        </div>
        <button className="btn primary" onClick={() => onCreate('project')}>
          <Plus size={17} />
          New project
        </button>
      </div>
      <div className="overview-banner">
        <div className="banner-copy">
          <span className="banner-kicker">
            <span /> YOUR WORK, IN A GOOD PLACE
          </span>
          <h2>
            Big ideas.
            <br />
            <span>Small, steady steps.</span>
          </h2>
          <p>
            You have {stats.mine} {stats.mine === 1 ? 'task' : 'tasks'} waiting for your touch.
            <br />A little focus goes a long way.
          </p>
          <button onClick={() => onNavigate('tasks')} className="banner-button">
            Find your next step
            <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="orbit-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="orbit-path path-a" />
          <div className="orbit-path path-b" />
          <div className="orbit-path path-c" />
          <div className="art-sphere">
            <div className="sphere-highlight" />
          </div>
          <span className="orbit-satellite satellite-one">
            <Sparkles size={20} />
          </span>
          <span className="orbit-satellite satellite-two">
            <CheckCircle2 size={19} />
          </span>
          <span className="art-caption">
            <i />
            IN YOUR ORBIT
          </span>
          <span className="art-coordinate">37.8° N / WORK IN MOTION</span>
        </div>
        <div className="banner-pill">
          <span className="live-dot" />A little more in sync
        </div>
      </div>
      <div className="stat-grid">
        {cards.map((c, i) => (
          <motion.button
            className="stat-card"
            key={c.label}
            onClick={() => onNavigate(c.view, c.filters)}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08 * i,
            }}
          >
            <div>
              <span>{c.label}</span>
              <span className={`stat-icon tint-${c.color}`}>
                <c.icon size={17} />
              </span>
            </div>
            <strong>{c.value.toString().padStart(2, '0')}</strong>
            <footer>
              <span>{c.caption}</span>
              <ArrowUpRight size={14} />
            </footer>
          </motion.button>
        ))}
      </div>
      <section className="projects-section">
        <div className="section-heading">
          <h2>
            Your projects<span className="section-count">{projects.length}</span>
          </h2>
          <ArrowLink onClick={() => onNavigate('projects')}>View all projects</ArrowLink>
        </div>
        {projects.length ? (
          <div className="project-grid">
            {projects
              .filter((p) => p.status !== 'Archived')
              .slice(0, 3)
              .map((p, i) => (
                <ProjectCard project={p} tasks={tasks} key={p._id} onOpen={onProject} index={i} />
              ))}
          </div>
        ) : (
          <Empty
            title="Every great thing starts somewhere."
            text="Create your first project and give your ideas a home."
            action={
              <button className="btn primary" onClick={() => onCreate('project')}>
                <Plus size={16} />
                Create a project
              </button>
            }
          />
        )}
      </section>
      <div className="insight-grid">
        <section className="panel momentum-panel">
          <div className="section-heading">
            <div>
              <h2>A little momentum</h2>
              <p>Completed work. Steady progress.</p>
            </div>
            <select
              aria-label="Chart time range"
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
            </select>
          </div>
          <div className="chart-summary">
            <strong>
              {series.reduce((n, d) => n + d.value, 0)}
              <span>tasks completed</span>
            </strong>
            <span className="chart-key">
              <i />
              Completed tasks
            </span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={`Completed tasks over ${range} days: ${series.map((d) => dateLabel(d.date) + ': ' + d.value).join(', ')}`}
          >
            <div className="chart-grid">
              {[max, Math.round(max / 2), 0].map((v, i) => (
                <div key={i}>
                  <span>{v}</span>
                  <i />
                </div>
              ))}
            </div>
            <div className="chart-bars">
              {series.map((d, i) => (
                <div className="bar-column" key={i}>
                  <div className="bar-area">
                    <motion.div
                      className={`chart-bar ${i === series.length - 1 ? 'today' : ''}`}
                      initial={{
                        height: 0,
                      }}
                      animate={{
                        height: (d.value / max) * 100 + '%',
                      }}
                      transition={{
                        duration: 0.7,
                        delay: i * 0.035,
                      }}
                    >
                      <span className="bar-tooltip">{d.value} completed</span>
                    </motion.div>
                  </div>
                  <span>{range === 14 ? d.date.getDate() : d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <footer className="chart-footer">
            <span className="live-dot" />
            Small wins add up. Keep going.
          </footer>
        </section>
        <section className="panel activity-panel">
          <div className="section-heading">
            <h2>In the loop</h2>
            <button
              className="icon-button"
              aria-label="View all activity"
              onClick={() => onNavigate('activity')}
            >
              <ArrowUpRight size={18} />
            </button>
          </div>
          <ActivityFeed activity={activity} compact />
          <button className="activity-link" onClick={() => onNavigate('activity')}>
            See what’s been happening
            <ArrowRight size={15} />
          </button>
        </section>
      </div>
      <section className="panel my-tasks-panel">
        <div className="section-heading">
          <div>
            <h2>Your next few steps</h2>
            <p>A little focus, right where it counts.</p>
          </div>
          <ArrowLink onClick={() => onNavigate('tasks')}>View my tasks</ArrowLink>
        </div>
        <TaskTable tasks={mine} onOpen={onTask} onMove={onMove} compact />
      </section>
      <footer className="workspace-footer">
        <span>
          <Orbit size={15} />
          Built for a better kind of busy.
        </span>
        <span>
          Make something that matters.
          <ArrowUpRight size={13} />
        </span>
      </footer>
    </>
  );
}
