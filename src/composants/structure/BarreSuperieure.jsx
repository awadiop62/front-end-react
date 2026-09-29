import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contextes/ContexteAuth';
import { useTheme } from '../../contextes/ContexteTheme';
import { useElection } from '../../contextes/ContexteScrutin';
import { useAppMode } from '../../contextes/ContexteModeApp';

export default function TopBar({ onToggleNav }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    hasVoted,
    isAdmin,
    canViewResults,
  } = useElection();
  const { mode } = useAppMode();

  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : '?';



  return (
    <header className="topbar-container">
      <div className="topbar">
        {/* Zone 1 : Wordmark Brand + Basculeur de Mode Desktop + Indicateur de Phase */}
        <div className="topbar__left">
          <button
            className="topbar__icon-btn topbar__hamburger"
            onClick={onToggleNav}
            aria-label="Ouvrir la navigation"
          >
            <span className="msr msr-24" aria-hidden="true">menu</span>
          </button>

          <div
            className="topbar__brand"
            onClick={() => navigate(isAdmin ? '/admin' : '/intention')}
            role="button"
            tabIndex={0}
            title="Accueil Plateforme de Vote PolyHack"
          >
            <img
              src="/logo.jpg"
              alt="Logo PolyHack"
              className="topbar__brand-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Zone 2 : Liens de navigation selon le Mode actif */}
        <nav className="topbar__dynamic-nav" aria-label="Navigation principale">
        {!isAdmin && location.pathname !== '/intention' && mode === 'vote' && (
          <>
            <NavLink
              to="/hub"
              className={({ isActive }) =>
                `topbar__nav-link ${isActive ? 'topbar__nav-link--active' : ''}`
              }
            >
              <span className="msr msr-18" aria-hidden="true">how_to_vote</span>
              <span>Vote</span>
            </NavLink>

            <NavLink
              to="/galerie"
              className={({ isActive }) =>
                `topbar__nav-link ${isActive ? 'topbar__nav-link--active' : ''}`
              }
            >
              <span className="msr msr-18" aria-hidden="true">grid_view</span>
              <span>Galerie des projets</span>
            </NavLink>

            {hasVoted && (
              <NavLink
                to="/mon-recu"
                className={({ isActive }) =>
                  `topbar__nav-link topbar__nav-link--voted ${isActive ? 'topbar__nav-link--active' : ''}`
                }
              >
                <span className="msr msr-18" aria-hidden="true">receipt_long</span>
                <span>Mon reçu</span>
              </NavLink>
            )}

            {canViewResults && (
              <NavLink
                to="/resultats"
                className={({ isActive }) =>
                  `topbar__nav-link ${isActive ? 'topbar__nav-link--active' : ''}`
                }
              >
                <span className="msr msr-18" aria-hidden="true">leaderboard</span>
                <span>Résultats</span>
              </NavLink>
            )}
          </>
        )}

        {!isAdmin && location.pathname !== '/intention' && mode === 'candidature' && (
          <>
            <NavLink
              to="/soumettre"
              className={({ isActive }) =>
                `topbar__nav-link ${isActive ? 'topbar__nav-link--active' : ''}`
              }
            >
              <span className="msr msr-18" aria-hidden="true">add_circle</span>
              <span>Soumission de projet</span>
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `topbar__nav-link topbar__nav-link--admin ${isActive ? 'topbar__nav-link--active' : ''}`
              }
            >
              <span className="msr msr-18" aria-hidden="true">admin_panel_settings</span>
              <span>Administration</span>
            </NavLink>
            <NavLink
              to="/galerie"
              className={({ isActive }) =>
                `topbar__nav-link ${isActive ? 'topbar__nav-link--active' : ''}`
              }
            >
              <span className="msr msr-18" aria-hidden="true">grid_view</span>
              <span>Projets</span>
            </NavLink>
            <NavLink
              to="/resultats"
              className={({ isActive }) =>
                `topbar__nav-link ${isActive ? 'topbar__nav-link--active' : ''}`
              }
            >
              <span className="msr msr-18" aria-hidden="true">leaderboard</span>
              <span>Résultats</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Zone 3 : Thème et Profil */}
      <div className="topbar__right">
        <button className="topbar__icon-btn" onClick={toggleTheme} aria-label="Changer de thème">
          <span className="msr msr-20" aria-hidden="true">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {user && (
          <div className="topbar__account" ref={menuRef}>
            <button
              className="topbar__avatar"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Compte de ${user.prenom} ${user.nom}`}
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="topbar__account-menu" role="menu">
                <div className="topbar__account-info">
                  <p className="text-label">{user.prenom} {user.nom}</p>
                  <p className="text-caption">{user.classe}</p>
                  <span
                    className="mono-label"
                    style={{
                      fontSize: '10px',
                      color: isAdmin ? 'var(--accent)' : 'var(--success)',
                      marginTop: '4px',
                      display: 'inline-block',
                    }}
                  >
                    {isAdmin ? 'Administrateur' : 'ESP'}
                  </span>
                </div>
                <button className="topbar__menu-item" role="menuitem" onClick={logout}>
                  <span className="msr msr-18" aria-hidden="true">logout</span>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </header>
  );
}
