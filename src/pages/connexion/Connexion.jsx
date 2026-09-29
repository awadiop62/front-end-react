import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contextes/ContexteAuth';
import { useTheme } from '../../contextes/ContexteTheme';
import { useAppMode } from '../../contextes/ContexteModeApp';
import { fetchScrutinInfo } from '../../api/projectsService';
import { isAdminRole } from '../../types/models';
import { computeElectionPeriodStatuses } from '../../utilitaires/dateScrutin';
import Carte from '../../composants/ui/Carte';
import Insigne from '../../composants/ui/Insigne';
import Alerte from '../../composants/ui/Alerte';
import Modale from '../../composants/ui/Modale';
import { PageSpinner } from '../../composants/ui/Squelette';
import VoterLoginForm from '../../composants/auth/FormulaireConnexionVotant';

export default function Login() {
  const { loginAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { resetModeChoice } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();

  const isSessionExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const [scrutin, setScrutin] = useState(null);
  const [loadingScrutin, setLoadingScrutin] = useState(true);

  // Modal secret administrateur avec email et code d'accès
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin.commission-it@esp.sn');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminAuthenticating, setAdminAuthenticating] = useState(false);
  const [adminError, setAdminError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchScrutinInfo()
      .then((s) => {
        if (!cancelled) setScrutin(s);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingScrutin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const periodStatuses = useMemo(() => computeElectionPeriodStatuses(scrutin), [scrutin]);
  const { isVoteOuvert, isVoteCloture, isVoteAVenir } = periodStatuses;

  function handleLoginSuccess(_user, _token) {
    resetModeChoice?.();
    const target = isAdminRole(_user?.role) ? '/admin' : '/intention';
    navigate(target, { replace: true });
  }

  async function handleAdminLogin(e) {
    e?.preventDefault();
    const emailClean = adminEmail.trim();
    const passcodeClean = adminPasscode.trim();

    if (!emailClean) {
      setAdminError("Veuillez saisir votre adresse e-mail administrateur.");
      return;
    }
    if (!passcodeClean) {
      setAdminError("Veuillez saisir le code d'accès Administrateur.");
      return;
    }
    setAdminError(null);
    setAdminAuthenticating(true);
    try {
      await loginAdmin({
        email: emailClean,
        passcode: passcodeClean,
      });
      setAdminModalOpen(false);
      navigate('/admin', { replace: true });
    } catch (err) {
      setAdminError(err.message || "Identifiants Administrateur invalides.");
    } finally {
      setAdminAuthenticating(false);
    }
  }

  if (loadingScrutin) {
    return <PageSpinner label="Initialisation du portail d'authentification…" />;
  }

  return (
    <div className="login-screen">
      <button
        className="login-screen__theme"
        onClick={toggleTheme}
        aria-label="Changer de thème"
      >
        <span className="msr msr-20" aria-hidden="true">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="login-screen__inner" style={{ maxWidth: '640px' }}>
        {/* En-tête Institutionnel PolyHack */}
        <div className="login-screen__brand">
          <img
            src="/logo.jpg"
            alt="Logo PolyHack"
            className="login-screen__brand-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <span className="text-label" style={{ display: 'block' }}>
              Plateforme de Vote · PolyHack 2026
            </span>
          </div>
        </div>

        {/* Notification session expirée */}
        {isSessionExpired && (
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <Alerte tone="warn">
              <strong>Session expirée :</strong> Votre session a expiré ou a été invalidée par le serveur. Veuillez vous reconnecter.
            </Alerte>
          </div>
        )}

        {/* Bannière d'état du scrutin en cours */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: 'var(--space-md)',
            padding: '10px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--ink)', display: 'block' }}>
              {scrutin?.titre || 'Scrutin PolyHack 2026'}
            </strong>
            <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>
              {isVoteOuvert
                ? 'Vote en cours.'
                : isVoteCloture
                ? 'Scrutin fermé.'
                : 'Scrutin à venir.'}
            </span>
          </div>
          <Insigne
            tone={isVoteOuvert ? 'success' : isVoteAVenir ? 'accent' : 'neutral'}
            icon={isVoteOuvert ? 'how_to_vote' : isVoteAVenir ? 'schedule' : 'lock'}
          >
            {isVoteOuvert ? 'Scrutin ouvert' : isVoteAVenir ? 'À venir' : 'Scrutin fermé'}
          </Insigne>
        </div>

        {/* Formulaire de Connexion Sécurisé Électeur */}
        <Carte style={{ padding: 'var(--space-xl)', boxShadow: 'var(--shadow-md)' }}>
          <VoterLoginForm
            onSuccess={handleLoginSuccess}
          />
        </Carte>

        {/* Accès discret Administrateur */}
        <footer
          style={{
            marginTop: 'var(--space-xl)',
            textAlign: 'center',
            borderTop: '1px solid var(--border)',
            paddingTop: 'var(--space-md)',
          }}
        >
          <button
            type="button"
            onClick={() => setAdminModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-subtle)',
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease',
            }}
            title="Espace réservé à l'Administrateur"
          >
            <span className="msr msr-16" aria-hidden="true">admin_panel_settings</span>
            <span>Accès sécurisé Administrateur</span>
          </button>
        </footer>
      </div>

      {/* Modal d'authentification Administrateur */}
      <Modale
        open={adminModalOpen}
        onClose={() => !adminAuthenticating && setAdminModalOpen(false)}
        icon="admin_panel_settings"
        title="Accès Administrateur"
        description="Espace d'administration réservé au paramétrage du scrutin, à l'import de la liste électorale et au dépouillement."
        confirmLabel="Connexion Administrateur"
        cancelLabel="Fermer"
        onConfirm={handleAdminLogin}
        confirmLoading={adminAuthenticating}
      >
        {adminError && <Alerte tone="err">{adminError}</Alerte>}

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
          <div className="field">
            <label htmlFor="admin-email" className="field__label">
              Adresse e-mail Administrateur (Commission IT)
            </label>
            <div className="field__control">
              <input
                id="admin-email"
                type="email"
                className="field__input"
                placeholder="admin.commission-it@esp.sn"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="admin-passcode" className="field__label">
              Code d'accès Administrateur (Passkey)
            </label>
            <div className="field__control">
              <input
                id="admin-passcode"
                type="password"
                className="field__input"
                placeholder="Saisissez le code d'accès"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <span className="text-caption" style={{ color: 'var(--ink-subtle)' }}>
                Code environnement de test : <code>ESP2026</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAdminEmail('admin.commission-it@esp.sn');
                  setAdminPasscode('ESP2026');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
              >
                Préremplir compte de test
              </button>
            </div>
          </div>
        </form>
      </Modale>
    </div>
  );
}
