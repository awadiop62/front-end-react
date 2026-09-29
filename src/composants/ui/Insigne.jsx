export default function Badge({ children, tone = 'neutral', icon, className = '' }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      {icon && <span className="msr msr-16" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
