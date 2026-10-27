import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Command,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Brand, Spinner } from './ui';
import { api } from '../lib/api';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  async function submit(e, demo = false) {
    e?.preventDefault();
    setError('');
    setBusy(demo ? 'demo' : 'auth');
    try {
      const form = demo ? null : new FormData(e.currentTarget);
      const user = await api('/auth/' + (demo ? 'demo' : mode), {
        method: 'POST',
        body: demo ? {} : Object.fromEntries(form),
      });
      onAuth(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="story-copy">
          <span className="story-kicker">
            <span /> A LITTLE SPACE. A LOT OF POSSIBILITY.
          </span>
          <h1>
            Great work
            <br />
            needs a little
            <br />
            <em>space to orbit.</em>
          </h1>
          <p>
            Your projects, people, and next big thing.
            <br />
            Finally, moving in the same direction.
          </p>
        </div>
        <div className="auth-visual" aria-hidden="true">
          <div className="visual-ring ring-one" />
          <div className="visual-ring ring-two" />
          <div className="visual-orb" />
          <motion.div
            className="floating-note note-one"
            animate={{ y: [0, -9, 0], rotate: [-7, -5, -7] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <span className="note-icon">
              <Layers size={18} />
            </span>
            <span>
              <b>A little more clarity.</b>
              <small>A lot more momentum.</small>
            </span>
            <span className="note-check">
              <Check size={15} />
            </span>
          </motion.div>
          <motion.div
            className="floating-note note-two"
            animate={{ y: [0, 8, 0], rotate: [6, 4, 6] }}
            transition={{ duration: 7, repeat: Infinity }}
          >
            <span className="tiny-avatars">
              <i>AM</i>
              <i>MC</i>
              <i>JL</i>
            </span>
            <span>
              <b>Better, together.</b>
              <small>One shared direction.</small>
            </span>
            <ArrowUpRight size={18} />
          </motion.div>
        </div>
        <footer>
          <span>LESS BUSYWORK. MORE GOOD WORK.</span>
          <span>
            EST. 2026 <Sparkles size={13} />
          </span>
        </footer>
      </section>
      <section className="auth-form-side">
        <span className="auth-top">
          A workspace with a different kind of energy <span>↗</span>
        </span>
        <div className="auth-form">
          <span className="eyebrow">WELCOME TO YOUR NEXT CHAPTER</span>
          <h2>{mode === 'login' ? 'Find your flow.' : 'Make room for good work.'}</h2>
          <p>
            {mode === 'login'
              ? 'Sign in, settle in, and make something great.'
              : 'Start a workspace that moves at your rhythm.'}
          </p>
          <button className="btn demo-button" disabled={!!busy} onClick={(e) => submit(e, true)}>
            {busy === 'demo' ? <Spinner /> : <Sparkles size={18} />}Explore the live demo
            <ArrowRight size={18} />
          </button>
          <div className="demo-caption">
            <ShieldCheck size={13} />
            Your own private playground. No sign-up needed.
          </div>
          <div className="divider">
            <span>or {mode === 'login' ? 'sign in' : 'create your account'} with email</span>
          </div>
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <label>
                Your name
                <input
                  name="name"
                  placeholder="Alex Morgan"
                  required
                  maxLength={80}
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="you@yourteam.com"
                required
                autoComplete="email"
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder={mode === 'signup' ? 'At least 10 characters' : 'Your password'}
                required
                minLength={mode === 'signup' ? 10 : 1}
                maxLength={72}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="btn primary auth-submit" disabled={!!busy}>
              {busy === 'auth' ? <Spinner /> : null}
              {mode === 'login' ? 'Let’s get to work' : 'Create my workspace'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? 'New around here?' : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Make yourself at home' : 'Sign in'}
              <ArrowUpRight size={14} />
            </button>
          </p>
        </div>
        <footer className="auth-bottom">
          <Brand small />
          <span>Made for people who make things.</span>
          <Command size={17} />
        </footer>
      </section>
    </div>
  );
}
