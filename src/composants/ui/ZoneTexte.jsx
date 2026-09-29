import { useId } from 'react';

export default function Textarea({ label, hint, error, rows = 4, className = '', ...rest }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label}
        </label>
      )}
      <div className={`field__control field__control--textarea ${error ? 'field__control--error' : ''}`}>
        <textarea id={id} rows={rows} aria-describedby={describedBy} aria-invalid={Boolean(error)} {...rest} />
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
