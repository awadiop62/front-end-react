import { useId } from 'react';

export default function Input({ label, hint, error, icon, className = '', ...rest }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label}
        </label>
      )}
      <div className={`field__control ${icon ? 'field__control--has-icon' : ''} ${error ? 'field__control--error' : ''}`}>
        {icon && <span className="msr msr-18 field__icon" aria-hidden="true">{icon}</span>}
        <input id={id} aria-describedby={describedBy} aria-invalid={Boolean(error)} {...rest} />
      </div>
      {error ? (
        <p id={`${id}-error`} className="field__message field__message--error">
          <span className="msr msr-16" aria-hidden="true">error</span>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field__message">{hint}</p>
      ) : null}
    </div>
  );
}
