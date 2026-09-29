import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Bouton from './Bouton';

export default function Modal({
  open,
  isOpen,
  onClose,
  icon = 'lock',
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  confirmVariant = 'primary',
  confirmLoading = false,
  children,
}) {
  const dialogRef = useRef(null);
  const isCurrentlyOpen = Boolean(open || isOpen);

  // Stocker onClose dans un ref pour éviter de relancer l'effet à chaque render (lorsque onClose est inline)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isCurrentlyOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isCurrentlyOpen]);

  if (!isCurrentlyOpen) return null;

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        {icon && (
          <div className="modal__icon">
            <span className="msr msr-24" aria-hidden="true">{icon}</span>
          </div>
        )}
        <h2 id="modal-title" className="text-h3">{title}</h2>
        {description && <p className="text-body modal__description">{description}</p>}
        {children}
        <div className="modal__actions">
          {cancelLabel && (
            <Bouton variant="secondary" onClick={onClose}>{cancelLabel}</Bouton>
          )}
          {onConfirm && (
            <Bouton variant={confirmVariant} onClick={onConfirm} loading={confirmLoading}>
              {confirmLabel}
            </Bouton>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
