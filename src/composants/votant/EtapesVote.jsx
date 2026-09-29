import { Link } from 'react-router-dom';
import { useEstMobile } from '../../hooks/useEstMobile';

/**
 * Composant de progression visuelle pour le parcours électoral complet :
 * 1. Choisir un projet -> 2. Confirmer mon vote -> 3. Recevoir mon reçu -> 4. Résultats
 */
export default function VoteStepper({
  currentStep = 'galerie',
  isLocked = false,
  visible = true,
}) {
  const isMobile = useEstMobile();
  if (!visible) return null;

  const steps = [
    {
      id: 'galerie',
      number: 1,
      title: isMobile ? '1. Projets' : '1. Choisir un projet',
      link: '/galerie',
    },
    {
      id: 'confirmation',
      number: 2,
      title: isMobile ? '2. Vote' : '2. Confirmer mon vote',
      link: null,
    },
    {
      id: 'recu',
      number: 3,
      title: isMobile ? '3. Reçu' : '3. Recevoir mon reçu',
      link: '/mon-recu',
    },
    {
      id: 'resultats',
      number: 4,
      title: isMobile ? '4. Résultats' : '4. Résultats (clôture)',
      link: '/resultats',
    },
  ];

  const getStepState = (stepId, stepNum) => {
    if (stepId === 'confirmation' && isLocked) {
      return 'locked';
    }

    if (currentStep === 'galerie') {
      if (stepNum === 1) return 'active';
      return 'upcoming';
    }

    if (currentStep === 'confirmation') {
      if (stepNum === 1) return 'completed';
      if (stepNum === 2) return 'active';
      return 'upcoming';
    }

    if (currentStep === 'recu') {
      if (stepNum === 1) return 'completed';
      if (stepNum === 2) return 'completed';
      if (stepNum === 3) return 'active';
      return 'upcoming';
    }

    if (currentStep === 'resultats') {
      if (stepNum === 1 || stepNum === 2 || stepNum === 3) return 'completed';
      if (stepNum === 4) return 'active';
      return 'upcoming';
    }

    return 'upcoming';
  };

  return (
    <div
      className="vote-stepper"
      style={{
        margin: '0 auto var(--space-md) auto',
        maxWidth: '680px',
        width: '100%',
        padding: isMobile ? '10px 12px' : 'var(--space-md)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {steps.map((step, idx) => {
          const state = getStepState(step.id, step.number);
          const isCompleted = state === 'completed';
          const isActive = state === 'active';
          const isLockedState = state === 'locked';

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Trait de connexion horizontal */}
              {idx < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: isMobile ? '14px' : '16px',
                    left: '50%',
                    width: '100%',
                    height: '2px',
                    backgroundColor:
                      isCompleted || (isActive && idx === 0 && currentStep !== 'galerie')
                        ? 'var(--success)'
                        : 'var(--border)',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Puce numérotée ou icône */}
              <div
                style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: isMobile ? '12px' : '14px',
                  backgroundColor: isCompleted
                    ? 'var(--success)'
                    : isActive
                    ? 'var(--accent)'
                    : 'var(--bg-subtle)',
                  color: isCompleted
                    ? '#ffffff'
                    : isActive
                    ? '#ffffff'
                    : 'var(--ink-muted)',
                  border: isLockedState
                    ? '1px dashed var(--border)'
                    : isActive
                    ? 'none'
                    : '1px solid var(--border)',
                  boxShadow: isActive ? '0 0 0 3px var(--accent-bg)' : 'none',
                  transition: 'all var(--duration-fast)',
                }}
              >
                {isCompleted ? (
                  <span className="msr msr-16" aria-hidden="true">
                    check
                  </span>
                ) : isLockedState ? (
                  <span className="msr msr-16" style={{ color: 'var(--ink-muted)' }} aria-hidden="true">
                    lock
                  </span>
                ) : (
                  step.number
                )}
              </div>

              {/* Libellé de l'étape */}
              <span
                style={{
                  marginTop: '6px',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? 'var(--accent)'
                    : isCompleted
                    ? 'var(--success)'
                    : 'var(--ink-muted)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Message explicatif en cas d'étape bloquée */}
      {isLocked && (
        <div
          style={{
            marginTop: 'var(--space-sm)',
            padding: 'var(--space-xs) var(--space-sm)',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--ink-muted)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span className="msr msr-16" style={{ color: 'var(--ink-muted)' }} aria-hidden="true">
            lock
          </span>
          <span>
            Le vote n'est pas ouvert actuellement.{' '}
            <Link to="/galerie" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Galerie
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
