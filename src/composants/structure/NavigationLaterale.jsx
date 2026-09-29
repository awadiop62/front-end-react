import { NavLink, useLocation } from 'react-router-dom';
import { useElection } from '../../contextes/ContexteScrutin';
import { useAppMode } from '../../contextes/ContexteModeApp';

export default function SideNav({ open, onClose }) {
  const {
    isVoteOuvert,
    isVoteCloture,
    isResultatsPublies,
    hasVoted,
    isAdmin,
  } = useElection();
  const { mode } = useAppMode();
  const location = useLocation();

  return (
    <>
      {open && <div className="sidenav-backdrop" onClick={onClose} />}
      <nav className={`sidenav ${open ? 'sidenav--open' : ''}`} aria-label="Navigation principale">
        <div className="sidenav__section">
          {!isAdmin && location.pathname !== '/intention' && mode === 'vote' && (
            <div className="sidenav__group">
              <span className="mono-label sidenav__section-label" style={{ color: 'var(--accent)', letterSpacing: '0.05em' }}>
                ESPACE VOTE
              </span>
              <ul className="sidenav__list">
                <li>
                  <NavLink
                    to="/hub"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" style={{ color: 'var(--accent)' }} aria-hidden="true">
                      how_to_vote
                    </span>
                    <span className="sidenav__link-text" style={{ fontWeight: 600 }}>
                      Vote
                    </span>
                    {isVoteOuvert && (
                      <span className="mono-label sidenav__badge" style={{ backgroundColor: 'var(--success)', color: '#ffffff' }}>
                        OUVERT
                      </span>
                    )}
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/galerie"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" style={{ color: 'var(--accent)' }} aria-hidden="true">
                      grid_view
                    </span>
                    <span className="sidenav__link-text">Galerie des projets</span>
                  </NavLink>
                </li>

                {hasVoted && (
                  <li>
                    <NavLink
                    to="/mon-recu"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" style={{ color: 'var(--accent)' }} aria-hidden="true">
                      receipt_long
                    </span>
                    <span className="sidenav__link-text">Mon reçu</span>
                    <span className="mono-label sidenav__badge" style={{ backgroundColor: 'var(--success)', color: '#ffffff' }}>
                      REÇU ✓
                    </span>
                  </NavLink>
                </li>
                )}

                <li>
                  <NavLink
                    to="/resultats"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" style={{ color: 'var(--accent)' }} aria-hidden="true">
                      leaderboard
                    </span>
                    <span className="sidenav__link-text">Résultats</span>
                    {isResultatsPublies ? (
                      <span className="mono-label sidenav__badge" style={{ backgroundColor: 'var(--success)', color: '#ffffff' }}>
                        PUBLIÉ
                      </span>
                    ) : isVoteCloture ? (
                      <span className="mono-label sidenav__badge" style={{ backgroundColor: 'var(--warn-bg)', color: 'var(--warn-text)', border: '1px solid var(--warn-border)' }}>
                        EN COURS
                      </span>
                    ) : (
                      <span className="mono-label sidenav__badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--ink-muted)' }}>
                        CLÔTURE
                      </span>
                    )}
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          {!isAdmin && location.pathname !== '/intention' && mode === 'candidature' && (
            <div className="sidenav__group">
              <span className="mono-label sidenav__section-label" style={{ color: '#10b981', letterSpacing: '0.05em' }}>
                ESPACE CANDIDATURE
              </span>
              <ul className="sidenav__list">
                <li>
                  <NavLink
                    to="/soumettre"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" style={{ color: '#10b981' }} aria-hidden="true">
                      add_circle
                    </span>
                    <span className="sidenav__link-text" style={{ fontWeight: 600 }}>
                      Soumission de projet
                    </span>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}



          {/* ESPACE ADMINISTRATEUR ACTIF */}
          {isAdmin && (
            <div className="sidenav__group">
              <span className="mono-label sidenav__section-label" style={{ color: 'var(--accent)' }}>
                ADMINISTRATION
              </span>
              <ul className="sidenav__list">
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" aria-hidden="true">admin_panel_settings</span>
                    <span className="sidenav__link-text">Console Administrateur</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/galerie"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" aria-hidden="true">grid_view</span>
                    <span className="sidenav__link-text">Galerie des projets</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/resultats"
                    className={({ isActive }) => `sidenav__link ${isActive ? 'sidenav__link--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="msr msr-20 sidenav__link-icon" aria-hidden="true">leaderboard</span>
                    <span className="sidenav__link-text">Résultats du scrutin</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="sidenav__footer">
          <div className="sidenav__footer-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span className="msr msr-16" style={{ color: 'var(--accent)' }} aria-hidden="true">verified_user</span>
              <span className="mono-label" style={{ color: 'var(--accent)' }}>POLYHACK 2026</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
