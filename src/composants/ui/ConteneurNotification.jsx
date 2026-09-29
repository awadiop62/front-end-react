import { createPortal } from 'react-dom';

const ICONS = { success: 'check_circle', err: 'error', info: 'info' };

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.variant}`}>
          <span className="msr msr-18" aria-hidden="true">{ICONS[t.variant] || 'info'}</span>
          <span className="toast__message">{t.message}</span>
          {t.action ? (
            <button className="toast__action" onClick={() => { t.action.onClick(); onDismiss(t.id); }}>
              {t.action.label}
            </button>
          ) : (
            <button className="toast__close" aria-label="Fermer" onClick={() => onDismiss(t.id)}>
              <span className="msr msr-16" aria-hidden="true">close</span>
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body
  );
}
