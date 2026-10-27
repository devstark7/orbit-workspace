import { ShieldCheck, LogOut, Keyboard } from 'lucide-react';
import { Avatar } from './ui';
export default function SettingsPage({ user, logout, reduced, compact, setReduced, setCompact }) {
  return (
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
              <p>Your sign-in uses an HTTP-only cookie. Project access is checked on the server.</p>
            </div>
            <ShieldCheck size={22} />
          </div>
          {user.demo && (
            <p className="demo-note">
              This demo is just for you. It uses fictional teammates and expires after 24 hours. A
              temporary local database resets when the server stops.
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
  );
}
