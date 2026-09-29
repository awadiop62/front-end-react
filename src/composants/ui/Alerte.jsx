const ICONS = { info: 'info', success: 'check_circle', warn: 'warning', err: 'error' };

export default function Alert({ tone = 'info', children, className = '' }) {
  return (
    <div className={`alert alert--${tone} ${className}`} role={tone === 'err' ? 'alert' : 'status'}>
      <span className="msr msr-20" aria-hidden="true">{ICONS[tone]}</span>
      <div className="text-body alert__text">{children}</div>
    </div>
  );
}
