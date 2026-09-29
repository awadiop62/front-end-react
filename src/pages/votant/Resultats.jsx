import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchPublicResults } from '../../api/resultsService';
import { fetchScrutinInfo } from '../../api/projectsService';
import { ERROR_CODES } from '../../types/models';
import { useAuth } from '../../contextes/ContexteAuth';
import { useElection } from '../../contextes/ContexteScrutin';
import Carte from '../../composants/ui/Carte';
import Alerte from '../../composants/ui/Alerte';
import Bouton from '../../composants/ui/Bouton';
import Insigne from '../../composants/ui/Insigne';
import { ResultsSkeleton } from '../../composants/ui/Squelette';
import EtapesVote from '../../composants/votant/EtapesVote';

export default function Results() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrutin, setScrutin] = useState(null);
  const [results, setResults] = useState(null);
  const [lockedInfo, setLockedInfo] = useState(null);
  const [technicalError, setTechnicalError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isVoteOuvert, isVoteAVenir, isVoteCloture } = useElection();
  const isAdmin = user?.role === 'admin';

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setLockedInfo(null);
      setTechnicalError(null);
      const [s, r] = await Promise.all([
        fetchScrutinInfo(),
        fetchPublicResults().catch((err) => ({ __error: err })),
      ]);
      setScrutin(s);

      if (r?.__error) {
        const err = r.__error;
        if (
          err.code === ERROR_CODES.RESULTS_LOCKED ||
          err.code === ERROR_CODES.RESULTS_NOT_PUBLISHED ||
          err.status === 423
        ) {
          setLockedInfo(err.message || 'Résultats verrouillés jusqu’à la clôture et publication.');
        } else {
          setTechnicalError(err.message || 'Impossible de charger les résultats.');
        }
      } else {
        setResults(r);
      }
    } catch (err) {
      setTechnicalError(err.message || 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  if (loading) return <ResultsSkeleton />;

  const isOuvert = isVoteOuvert;
  const isAVenir = isVoteAVenir;
  const isCloture = isVoteCloture;
  const areResultsPublished = Boolean(scrutin?.resultatsPublies || (results && results.publie));

  // ERREUR TECHNIQUE RÉSEAU
  if (technicalError) {
    return (
      <div className="results" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <header>
          <span className="mono-label" style={{ color: 'var(--accent)' }}>
            {scrutin?.titre || 'Scrutin PolyHack 2026'}
          </span>
          <h1 className="text-display">Résultats du scrutin</h1>
        </header>

        <Carte style={{ padding: 'var(--space-lg)' }}>
          <Alerte tone="err">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <span>{technicalError}</span>
              <Bouton variant="secondary" size="sm" onClick={loadResults}>
                Réessayer
              </Bouton>
            </div>
          </Alerte>

          <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-xs)' }}>
            <Bouton variant="ghost" size="md" icon="home" onClick={() => navigate('/hub')}>
              Retour au Hub
            </Bouton>
          </div>
        </Carte>
      </div>
    );
  }

  // CAS 1 : SCRUTIN ENCORE OUVERT (Section 12 - Règle absolue de non divulgation)
  if (isOuvert || isAVenir) {
    return (
      <div className="results" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <EtapesVote currentStep="resultats" visible={true} />

        <header>
          <span className="mono-label" style={{ color: 'var(--accent)' }}>
            {scrutin?.titre || 'PolyHack 2026'}
          </span>
          <h1 className="text-display">Les résultats ne sont pas encore disponibles</h1>
        </header>

        <Carte style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-bg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-md)',
            }}
          >
            <span className="msr msr-32" style={{ color: 'var(--accent)' }} aria-hidden="true">
              lock_clock
            </span>
          </div>

          <h2 className="text-h2">Le vote est en cours</h2>
          <p className="text-body-lg" style={{ color: 'var(--ink-muted)', maxWidth: '520px', margin: '8px auto var(--space-lg)', lineHeight: 1.6 }}>
            Conformément au règlement du scrutin, l'urne électronique reste scellée pendant toute la durée du vote. Les résultats (classement, nombre de voix et pourcentages) seront automatiquement calculés et affichés ici dès la clôture officielle du scrutin{scrutin?.dateFin ? ` le ${new Date(scrutin.dateFin).toLocaleString('fr-FR')}` : ''}.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Link to="/galerie">
              <Bouton variant="primary" size="md" icon="grid_view" style={{ minHeight: '44px' }}>
                Voir les projets
              </Bouton>
            </Link>
            <Link to="/hub">
              <Bouton variant="secondary" size="md" icon="home" style={{ minHeight: '44px' }}>
                Retour au Hub
              </Bouton>
            </Link>
          </div>
        </Carte>
      </div>
    );
  }

  // CAS 2 : SCRUTIN TERMINÉ MAIS RÉSULTATS NON PUBLIÉS (uniquement visible par l'admin, les votants ont l'écran de préparation)
  if (isCloture && (!areResultsPublished || lockedInfo) && !isAdmin) {
    return (
      <div className="results" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <EtapesVote currentStep="resultats" visible={true} />

        <header>
          <span className="mono-label" style={{ color: 'var(--accent)' }}>
            {scrutin?.titre || 'PolyHack 2026'}
          </span>
          <h1 className="text-display">Résultats en préparation</h1>
        </header>

        <Carte style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--warn-bg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-md)',
            }}
          >
            <span className="msr msr-32" style={{ color: 'var(--warn-icon)' }} aria-hidden="true">
              hourglass_top
            </span>
          </div>

          <h2 className="text-h2">Le scrutin est terminé</h2>
          <p className="text-body-lg" style={{ color: 'var(--ink-muted)', maxWidth: '520px', margin: '8px auto var(--space-lg)', lineHeight: 1.6 }}>
            Le vote est désormais clôturé. L'Administrateur procède au dépouillement officiel de l'urne. Les résultats finaux seront affichés ici dès leur publication officielle par la Commission IT.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Bouton variant="secondary" size="md" icon="refresh" onClick={loadResults} style={{ minHeight: '44px' }}>
              Vérifier à nouveau
            </Bouton>
            <Link to="/hub">
              <Bouton variant="primary" size="md" icon="home" style={{ minHeight: '44px' }}>
                Retour au Hub
              </Bouton>
            </Link>
          </div>
        </Carte>
      </div>
    );
  }

  // CAS 3 : RÉSULTATS PUBLIÉS (OU CONSULTÉS PAR L'ADMINISTRATEUR)
  return (
    <div className="results" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <EtapesVote currentStep="resultats" visible={true} />

      <header style={{ marginBottom: 'var(--space-md)' }}>
        <span className="mono-label" style={{ color: 'var(--accent)' }}>
          {isAdmin ? 'CONSOLE ADMIN (DÉPOUILLEMENT PRIVÉ)' : 'OFFICIEL · POLYHACK 2026'}
        </span>
        <h1 className="text-display" style={{ marginTop: '4px' }}>
          Résultats du scrutin
        </h1>
        <p className="text-body" style={{ color: 'var(--ink-muted)' }}>
          Dépouillement certifié de l'urne et classement des lauréats du scrutin PolyHack.
        </p>
      </header>

      <Carte style={{ padding: 'var(--space-lg)' }}>
        {/* Résumé des votes */}
        <div
          className="results__summary"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 'var(--space-md)',
            borderBottom: '1px solid var(--border)',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
          }}
        >
          <div>
            <span className="mono-label" style={{ color: 'var(--accent)' }}>
              SUFFRAGES EXPRIMÉS
            </span>
            <div className="results__total tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>
              {results?.totalVoix || 0} voix au total
            </div>
          </div>
          <Insigne tone="success" icon="verified">
            Dépouillement certifié
          </Insigne>
        </div>

        {/* Classement clair */}
        <div className="results__ranking" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {results?.classement?.map((item, index) => {
            const rank = item.rang || index + 1;
            const isWinner = rank === 1;

            return (
              <div
                key={item.id}
                className="results__row-card"
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isWinner ? 'var(--accent-bg)' : 'var(--bg-subtle)',
                  border: isWinner ? '2px solid var(--accent)' : '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'transform var(--duration-fast)',
                }}
              >
                {/* Ligne haute : Rang, Nom et Voix */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: isWinner ? '20px' : '16px',
                        color: isWinner ? 'var(--accent)' : 'var(--ink-muted)',
                        minWidth: '32px',
                      }}
                    >
                      #{rank}
                    </span>
                    <span className="text-label" style={{ fontSize: isWinner ? '16px' : '15px', fontWeight: 700, color: 'var(--ink)' }}>
                      {item.nom}
                    </span>
                    {isWinner && (
                      <Insigne tone="accent" icon="emoji_events">
                        Lauréat PolyHack
                      </Insigne>
                    )}
                  </div>

                  <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                    <span>{item.voix} voix</span>
                    <span style={{ color: 'var(--ink-muted)', marginLeft: '8px' }}>({item.pourcentage}%)</span>
                  </div>
                </div>

                {/* Barre de progression visuelle */}
                <div
                  style={{
                    height: isWinner ? '10px' : '8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--border)',
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, item.pourcentage))}%`,
                      backgroundColor: isWinner ? 'var(--accent)' : 'var(--blue-400)',
                      borderRadius: 'var(--radius-pill)',
                      transition: 'width 0.6s ease-out',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Boutons de navigation */}
        <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          <Link to="/galerie">
            <Bouton variant="secondary" size="md" icon="grid_view" style={{ minHeight: '44px' }}>
              Voir les projets
            </Bouton>
          </Link>
          <Link to="/hub">
            <Bouton variant="primary" size="md" icon="home" style={{ minHeight: '44px' }}>
              Retour au Hub
            </Bouton>
          </Link>
        </div>
      </Carte>
    </div>
  );
}
