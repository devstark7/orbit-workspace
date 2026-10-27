import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X, ArrowUpRight, Orbit, Loader2, Check, AlertCircle } from 'lucide-react';
import { initials } from '../lib/domain';
export function Brand({ small = false }) {
  return (
    <span className={'brand ' + (small ? 'small' : '')}>
      <span className="brand-symbol">
        <Orbit size={small ? 22 : 27} strokeWidth={1.6} />
      </span>
      <span>
        orbit<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export function Avatar({ person, size = 'normal', index = 0 }) {
  return (
    <span title={person?.name || 'Unassigned'} className={`avatar avatar-${index % 4} ${size}`}>
      {initials(person?.name)}
    </span>
  );
}
export function AvatarGroup({ people = [] }) {
  return (
    <span className="avatar-group">
      {people.slice(0, 4).map((p, i) => (
        <Avatar key={p._id} person={p} size="small" index={i} />
      ))}
      {people.length > 4 && <span className="avatar extra">+{people.length - 4}</span>}
    </span>
  );
}
export function IconButton({ label, children, ...props }) {
  return (
    <button type="button" className="icon-button" title={label} aria-label={label} {...props}>
      {children}
    </button>
  );
}
export function Spinner() {
  return <Loader2 className="spin" size={18} aria-label="Loading" />;
}
export function Empty({
  title = 'A little space for what’s next.',
  text = 'Your next great idea starts here.',
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-orbit">
        <Orbit size={34} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status.replaceAll(' ', '-').toLowerCase()}`}>
      <i />
      {status === 'Todo' ? 'To do' : status}
    </span>
  );
}
export function Priority({ value }) {
  return (
    <span className={`priority priority-${value?.toLowerCase()}`}>
      <span className="priority-bars">
        <i />
        <i />
        <i />
      </span>
      {value}
    </span>
  );
}
export function PageMotion({ children, className = '' }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={
        reduced
          ? false
          : {
              opacity: 0,
              y: 10,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
export function Modal({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const el = ref.current;
    const focusables = () =>
      [...el.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(
        (n) => !n.disabled && n.offsetParent !== null,
      );
    (el.querySelector('[data-autofocus]') || focusables()[0])?.focus();
    const key = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab') {
        const list = focusables();
        const first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = old;
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`modal ${wide ? 'wide' : ''}`}
        initial={{
          opacity: 0,
          scale: 0.98,
          y: 12,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">YOUR WORK, IN MOTION</span>
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>
        {children}
      </motion.section>
    </div>
  );
}
export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 4500);
    return () => clearTimeout(id);
  }, [toast, onClose]);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={`toast ${toast.error ? 'error' : ''}`}
          role={toast.error ? 'alert' : 'status'}
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 10,
          }}
        >
          {toast.error ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
          <IconButton label="Dismiss notification" onClick={onClose}>
            <X size={15} />
          </IconButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export function ArrowLink({ children, onClick }) {
  return (
    <button type="button" className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={16} />
    </button>
  );
}
