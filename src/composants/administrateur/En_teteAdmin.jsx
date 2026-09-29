import Insigne from '../ui/Insigne';

export default function AdminHeader({ user }) {
  return (
    <header className="admin-header" style={{ marginBottom: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span className="mono-label" style={{ color: 'var(--accent)' }}>
          ESP · SCRUTIN POLYHACK
        </span>
        <span style={{ color: 'var(--ink-subtle)' }}>•</span>
        <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>
          Espace Administrateur
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <h1 className="text-h1" style={{ margin: 0 }}>Console Administrateur</h1>
        <Insigne tone="accent">
          <span className="msr msr-16" aria-hidden="true">security</span>
          Administrateur ({user?.nom || 'Admin'})
        </Insigne>
      </div>
    </header>
  );
}
