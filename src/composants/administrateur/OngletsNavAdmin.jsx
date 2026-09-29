export default function AdminNavTabs({ activeTab, onTabChange, electoralCount, pendingProjectsCount }) {
  return (
    <nav className="admin-nav-tabs" aria-label="Sections d'administration" style={{ marginBottom: 'var(--space-lg)' }}>
      <button
        className={`admin-tab-btn ${activeTab === 'scrutin' ? 'admin-tab-btn--active' : ''}`}
        onClick={() => onTabChange('scrutin')}
      >
        <span className="msr msr-18" aria-hidden="true">settings</span>
        1. Configurer le scrutin
      </button>
      <button
        className={`admin-tab-btn ${activeTab === 'liste' ? 'admin-tab-btn--active' : ''}`}
        onClick={() => onTabChange('liste')}
      >
        <span className="msr msr-18" aria-hidden="true">upload_file</span>
        2. Liste électorale ({electoralCount})
      </button>
      <button
        className={`admin-tab-btn ${activeTab === 'projets' ? 'admin-tab-btn--active' : ''}`}
        onClick={() => onTabChange('projets')}
      >
        <span className="msr msr-18" aria-hidden="true">assignment</span>
        3. Valider/Rejeter les projets
        {pendingProjectsCount > 0 && (
          <span className="badge badge--accent" style={{ marginLeft: '4px' }}>{pendingProjectsCount}</span>
        )}
      </button>
      <button
        className={`admin-tab-btn ${activeTab === 'resultats' ? 'admin-tab-btn--active' : ''}`}
        onClick={() => onTabChange('resultats')}
      >
        <span className="msr msr-18" aria-hidden="true">leaderboard</span>
        4. Résultats du scrutin
      </button>
      <button
        className={`admin-tab-btn ${activeTab === 'urne' ? 'admin-tab-btn--active' : ''}`}
        onClick={() => onTabChange('urne')}
      >
        <span className="msr msr-18" aria-hidden="true">inventory_2</span>
        5. Exporter l'urne
      </button>
    </nav>
  );
}
