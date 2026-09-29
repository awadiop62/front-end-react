export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="msr msr-18" aria-hidden="true">{icon}</span>
      )}
      <span className="btn__label">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="msr msr-18" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
}
