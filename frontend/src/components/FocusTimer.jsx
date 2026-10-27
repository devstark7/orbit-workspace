import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Timer, Check, Maximize2 } from 'lucide-react';
import { IconButton } from './ui';
export default function FocusTimer() {
  const [remaining, setRemaining] = useState(25 * 60),
    [running, setRunning] = useState(false),
    [mode, setMode] = useState(25),
    [expanded, setExpanded] = useState(false);
  const deadline = useRef(null);
  useEffect(() => {
    if (!running) return;
    deadline.current = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (!left) setRunning(false);
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [running]);
  function reset(minutes = mode) {
    setRunning(false);
    setMode(minutes);
    setRemaining(minutes * 60);
  }
  return (
    <section className={`focus-widget ${expanded ? 'expanded' : ''}`}>
      <header>
        <span>
          <Timer size={15} />A little focus
        </span>
        <IconButton
          label={expanded ? 'Collapse focus timer' : 'Expand focus timer'}
          onClick={() => setExpanded(!expanded)}
        >
          <Maximize2 size={13} />
        </IconButton>
      </header>
      <p>{remaining === 0 ? 'A little win. Take a breath.' : 'One thing at a time.'}</p>
      <div
        className="focus-time"
        role="timer"
        aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
      >
        {Math.floor(remaining / 60)
          .toString()
          .padStart(2, '0')}
        <span>:</span>
        {(remaining % 60).toString().padStart(2, '0')}
        <i className={running ? 'timer-running' : ''} />
      </div>
      {expanded && (
        <div className="focus-modes">
          {[25, 50, 5].map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => reset(m)}>
              {m === 5 ? 'Break' : m + ' min'}
            </button>
          ))}
        </div>
      )}
      <div className="focus-controls">
        <button
          className="focus-start"
          onClick={() => {
            if (!remaining) reset();
            else setRunning(!running);
          }}
        >
          {running ? (
            <Pause size={13} />
          ) : remaining === 0 ? (
            <Check size={13} />
          ) : (
            <Play size={13} />
          )}{' '}
          {running ? 'Pause' : remaining === 0 ? 'Start again' : 'Start focusing'}
        </button>
        <IconButton label="Reset focus timer" onClick={() => reset()}>
          <RotateCcw size={14} />
        </IconButton>
      </div>
    </section>
  );
}
