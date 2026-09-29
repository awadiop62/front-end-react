import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppMode } from '../../contextes/ContexteModeApp';
import { useAuth } from '../../contextes/ContexteAuth';
import { useElection } from '../../contextes/ContexteScrutin';
import { useEstMobile } from '../../hooks/useEstMobile';
import { formatPeriodDate } from '../../utilitaires/dateScrutin';
import Carte from '../../composants/ui/Carte';
import Insigne from '../../composants/ui/Insigne';
import Bouton from '../../composants/ui/Bouton';

export default function IntentSelection() {
  const navigate = useNavigate();
  const { setMode } = useAppMode();
  const { user } = useAuth();
  const {
    candidatureDateDebut,
    candidatureDateFin,
    dateDebut,
    dateFin,
    scrutin,
    hasVoted,
    voteBadge,
    candidatureBadge,
    refreshElection,
  } = useElection();
  const isMobile = useEstMobile();

  useEffect(() => {
    refreshElection();
  }, [refreshElection]);

  const handleSelect = (mode, path) => {
    setMode(mode);
    navigate(path);
  };

  const voteBadgeTone = voteBadge?.tone || 'neutral';
  const voteBadgeLabel = voteBadge?.label || 'Clos';

  const candidatureBadgeTone = candidatureBadge?.tone || 'neutral';
  const candidatureBadgeLabel = candidatureBadge?.label || 'Clos';

  return (
    <div
      style={{
        maxWidth: '820px',
        width: '100%',
        margin: isMobile ? 'var(--space-md) auto' : 'var(--space-lg) auto',
        padding: '0 16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}
    >
      {/* En-tête épuré */}
      <header style={{ textAlign: 'center' }}>
        <span className="mono-label" style={{ color: 'var(--accent)', letterSpacing: '0.06em' }}>
          POLYHACK 2026 · SÉLECTION D'ESPACE
        </span>
        <h1
          className="text-display"
          style={{
            marginTop: '6px',
            marginBottom: '12px',
            fontSize: isMobile ? '24px' : '30px',
            fontWeight: 800,
          }}
        >
          Bienvenue sur le portail
        </h1>

        {user && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xs)',
              maxWidth: '100%',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span className="msr msr-18" style={{ color: 'var(--accent)' }} aria-hidden="true">
              account_circle
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
              {user.prenom} {user.nom}
            </span>
            {hasVoted && (
              <span
                style={{
                  fontSize: '11px',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                A voté ✓
              </span>
            )}
          </div>
        )}
      </header>

      {/* Grille des 2 Espaces Principaux : Vote vs Candidature */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* CARTE 1 : ESPACE VOTE */}
        <Carte
          onClick={() => handleSelect('vote', '/hub')}
          style={{
            cursor: 'pointer',
            padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid var(--accent)',
            boxShadow: 'var(--shadow-e2)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            gap: 'var(--space-md)',
          }}
          className="intent-card"
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="msr msr-28" style={{ color: 'var(--accent)' }} aria-hidden="true">
                  how_to_vote
                </span>
              </div>
              <Insigne tone={voteBadgeTone}>
                {voteBadgeLabel}
              </Insigne>
            </div>

            <h2 className="text-h2" style={{ fontSize: '20px', marginBottom: '6px', color: 'var(--ink)' }}>
              Espace Vote
            </h2>

            <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '14px', margin: 0 }}>
              Consulter les projets en lice, voter et obtenir votre reçu.
            </p>
          </div>

          <Bouton
            tone="accent"
            style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('vote', '/hub');
            }}
          >
            <span className="msr msr-18" aria-hidden="true">how_to_vote</span>
            <span>Voter</span>
          </Bouton>
        </Carte>

        {/* CARTE 2 : ESPACE CANDIDATURE */}
        <Carte
          onClick={() => handleSelect('candidature', '/soumettre')}
          style={{
            cursor: 'pointer',
            padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid #10b981',
            boxShadow: 'var(--shadow-e2)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            gap: 'var(--space-md)',
          }}
          className="intent-card"
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--green-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="msr msr-28" style={{ color: '#10b981' }} aria-hidden="true">
                  upload_file
                </span>
              </div>
              <Insigne tone={candidatureBadgeTone}>
                {candidatureBadgeLabel}
              </Insigne>
            </div>

            <h2 className="text-h2" style={{ fontSize: '20px', marginBottom: '6px', color: 'var(--ink)' }}>
              Espace Candidature
            </h2>

            <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '14px', margin: 0 }}>
              Déposer le projet de votre équipe et suivre sa validation.
            </p>
          </div>

          <Bouton
            tone="neutral"
            style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('candidature', '/soumettre');
            }}
          >
            <span className="msr msr-18" aria-hidden="true">upload_file</span>
            <span>Candidater</span>
          </Bouton>
        </Carte>
      </div>

      {/* Calendrier synthétique des dates */}
      <Carte
        style={{
          padding: 'var(--space-md) var(--space-lg)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="msr msr-18" style={{ color: 'var(--accent)' }} aria-hidden="true">
            event
          </span>
          <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
            Calendrier officiel
          </strong>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <span className="mono-label" style={{ fontSize: '10px', color: '#10b981', display: 'block', marginBottom: '2px' }}>
              DÉPÔT DES CANDIDATURES
            </span>
            <p className="mono-data" style={{ margin: 0, fontSize: '12px', color: 'var(--ink)' }}>
              Du {formatPeriodDate(candidatureDateDebut)} au {formatPeriodDate(candidatureDateFin)}
            </p>
          </div>

          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <span className="mono-label" style={{ fontSize: '10px', color: 'var(--accent)', display: 'block', marginBottom: '2px' }}>
              PÉRIODE DU SCRUTIN
            </span>
            <p className="mono-data" style={{ margin: 0, fontSize: '12px', color: 'var(--ink)' }}>
              Du {formatPeriodDate(dateDebut || scrutin?.dateDebut)} au {formatPeriodDate(dateFin || scrutin?.dateFin)}
            </p>
          </div>
        </div>
      </Carte>
    </div>
  );
}
