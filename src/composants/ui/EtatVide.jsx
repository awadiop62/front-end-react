import Bouton from './Bouton';

export default function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span className="msr msr-24 empty-state__icon" aria-hidden="true">{icon}</span>
      <h3 className="text-h3">{title}</h3>
      {description && <p className="text-body empty-state__desc">{description}</p>}
      {actionLabel && onAction && (
        <Bouton icon="upload" onClick={onAction}>{actionLabel}</Bouton>
      )}
    </div>
  );
}
