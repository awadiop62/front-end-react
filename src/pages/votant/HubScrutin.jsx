import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contextes/ContexteAuth';
import { useElection } from '../../contextes/ContexteScrutin';
import { useEstMobile } from '../../hooks/useEstMobile';

import Bouton from '../../composants/ui/Bouton';
import Insigne from '../../composants/ui/Insigne';
import Carte from '../../composants/ui/Carte';
import Alerte from '../../composants/ui/Alerte';
import { PageSpinner } from '../../composants/ui/Squelette';
import ElectionCountdown from '../../composants/scrutin/CompteAReboursScrutin';

export default function ElectionHub() {
  const { user } = useAuth();
  const {
    scrutin,
    voteStatus,
    loading,
    error,
    refreshElection,
    isVoteOuvert,
    isVoteCloture,
    isVoteAVenir,
  } = useElection();
  const navigate = useNavigate();
  const isMobile = useEstMobile();

  if (loading) {
    return <PageSpinner label="Chargement de l’espace de vote…" />;
  }

  if (error) {
    return (
      <div className="election-hub" style={{ maxWidth: '880px', width: '100%', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
        <Alerte tone="err">{error}</Alerte>
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <Bouton variant="secondary" onClick={refreshElection} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
            Réessayer
          </Bouton>
        </div>
      </div>
    );
  }

  const isOuvert = isVoteOuvert;
  const isCloture = isVoteCloture;
  const isAVenir = isVoteAVenir;
  const hasVoted = Boolean(voteStatus?.aVote);

  return (
    <div className="election-hub" style={{ maxWidth: '880px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: '0 16px', boxSizing: 'border-box' }}>
      {/* En-tête Scrutin */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span className="mono-label" style={{ color: 'var(--accent)' }}>ESPACE VOTANT</span>
            <span style={{ color: 'var(--ink-subtle)' }}>•</span>
            <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>
              {user?.prenom} {user?.nom} ({user?.classe})
            </span>
          </div>
          <h1 className="text-display" style={{ margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {scrutin?.titre || 'Scrutin PolyHack 2026'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Insigne
            tone={isOuvert ? 'success' : isAVenir ? 'accent' : 'neutral'}
            icon={isOuvert ? 'bolt' : isAVenir ? 'schedule' : 'lock'}
          >
            {isOuvert ? 'Scrutin ouvert' : isAVenir ? 'À venir' : 'Scrutin fermé'}
          </Insigne>
          {scrutin?.secret && (
            <Insigne tone="accent" icon="verified_user">
              Vote anonyme
            </Insigne>
          )}
        </div>
      </header>

      {/* CAS 1 : SCRUTIN À VENIR */}
      {isAVenir && (
        <>
          <ElectionCountdown scrutin={scrutin} />
          <Carte style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <div>
                <h2 className="text-h2" style={{ margin: 0, overflowWrap: 'break-word' }}>Consulter les projets</h2>
                <p className="text-body" style={{ color: 'var(--ink-muted)', marginTop: '4px', overflowWrap: 'break-word' }}>
                  Découvrez les candidatures validées avant l'ouverture du vote.
                </p>
              </div>
              <Bouton variant="primary" icon="grid_view" onClick={() => navigate('/galerie')} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
                Voir les projets
              </Bouton>
            </div>
          </Carte>
        </>
      )}

      {/* CAS 2 : SCRUTIN OUVERT - NON ENCORE VOTÉ */}
      {isOuvert && !hasVoted && (
        <Carte style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-xl)', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--accent-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="msr msr-28" style={{ color: 'var(--accent)' }} aria-hidden="true">
                how_to_vote
              </span>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
              <h2 className="text-h2" style={{ margin: 0, overflowWrap: 'break-word' }}>Vote en cours</h2>
              <p className="text-body" style={{ color: 'var(--ink-muted)', margin: '8px 0 var(--space-md)', overflowWrap: 'break-word' }}>
                Consultez la liste des projets validés et choisissez le projet pour lequel vous souhaitez voter.
              </p>
              <Bouton variant="primary" size="lg" icon="grid_view" onClick={() => navigate('/galerie')} style={{ minHeight: '48px', width: isMobile ? '100%' : 'auto' }}>
                Voir les projets
              </Bouton>
            </div>
          </div>
        </Carte>
      )}

      {/* CAS 3 : SCRUTIN OUVERT OU FERMÉ - DÉJÀ VOTÉ */}
      {hasVoted && (
        <Carte style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-xl)', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="msr msr-28" style={{ color: 'var(--success)' }} aria-hidden="true">
                check_circle
              </span>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
              <h2 className="text-h2" style={{ margin: 0, overflowWrap: 'break-word' }}>Vote enregistré</h2>
              <p className="text-body" style={{ color: 'var(--ink-muted)', margin: '8px 0 var(--space-md)', overflowWrap: 'break-word' }}>
                Votre suffrage a été enregistré sous secret de l'urne. Vous pouvez consulter ou télécharger votre reçu à tout moment.
              </p>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 'var(--space-sm)', width: '100%', flexWrap: 'wrap' }}>
                <Bouton variant="primary" icon="receipt_long" onClick={() => navigate('/mon-recu')} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
                  Voir mon reçu
                </Bouton>
                <Bouton variant="secondary" icon="leaderboard" onClick={() => navigate('/resultats')} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
                  Voir les résultats
                </Bouton>
                <Bouton variant="ghost" icon="grid_view" onClick={() => navigate('/galerie')} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
                  Voir les projets
                </Bouton>
              </div>
            </div>
          </div>
        </Carte>
      )}

      {/* BLOC INFORMATIF : PARCOURS DES RÉSULTATS */}
      <Carte style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="msr msr-20" style={{ color: 'var(--accent)' }} aria-hidden="true">
                leaderboard
              </span>
              <span className="mono-label" style={{ color: 'var(--accent)' }}>
                DÉPOUILLEMENT & RÉSULTATS
              </span>
            </div>
            <h3 className="text-h3" style={{ margin: '2px 0 4px 0', fontSize: isMobile ? '16px' : '18px' }}>
              Où et quand s'affichent les résultats ?
            </h3>
            <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              {scrutin?.resultatsPublies
                ? 'Les résultats officiels du scrutin ont été publiés par la Commission IT. Le classement complet est disponible.'
                : isCloture
                ? 'Le vote est clos. Le dépouillement et la proclamation des résultats sont en cours par la Commission IT.'
                : 'Les résultats (classement, voix et pourcentages) sont scellés et seront proclamés à la clôture du vote.'}
            </p>
          </div>

          <Bouton
            variant={scrutin?.resultatsPublies ? 'primary' : 'secondary'}
            icon="leaderboard"
            onClick={() => navigate('/resultats')}
            style={{ width: isMobile ? '100%' : 'auto', minHeight: '44px', flexShrink: 0, fontWeight: 600 }}
          >
            {scrutin?.resultatsPublies ? 'Consulter les résultats' : 'Page des résultats'}
          </Bouton>
        </div>
      </Carte>

      {/* CAS 4 : SCRUTIN CLÔTURÉ - NON VOTÉ */}
      {isCloture && !hasVoted && (
        <Carte style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-xl)', borderLeft: '4px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="msr msr-28" style={{ color: 'var(--ink-muted)' }} aria-hidden="true">
                lock
              </span>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
              <h2 className="text-h2" style={{ margin: 0, overflowWrap: 'break-word' }}>Scrutin fermé</h2>
              <p className="text-body" style={{ color: 'var(--ink-muted)', margin: '8px 0 var(--space-md)', overflowWrap: 'break-word' }}>
                La période de vote est terminée. Consultez les résultats ou la galerie des projets.
              </p>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 'var(--space-sm)', width: '100%' }}>
                <Bouton variant="primary" icon="leaderboard" onClick={() => navigate('/resultats')} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
                  Voir les résultats
                </Bouton>
                <Bouton variant="secondary" icon="grid_view" onClick={() => navigate('/galerie')} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
                  Voir les projets
                </Bouton>
              </div>
            </div>
          </div>
        </Carte>
      )}
    </div>
  );
}
