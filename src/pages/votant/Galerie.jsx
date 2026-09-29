import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProjects, fetchScrutinInfo } from '../../api/projectsService';
import { checkVoteStatus } from '../../api/voteService';
import { useElection } from '../../contextes/ContexteScrutin';
import { useEstMobile } from '../../hooks/useEstMobile';
import { PROJECT_STATUS } from '../../types/models';
import Bouton from '../../composants/ui/Bouton';
import Insigne from '../../composants/ui/Insigne';
import Alerte from '../../composants/ui/Alerte';
import EtatVide from '../../composants/ui/EtatVide';
import { GallerySkeleton } from '../../composants/ui/Squelette';
import EtapesVote from '../../composants/votant/EtapesVote';

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';

  const [searchQ, setSearchQ] = useState(initialQ);
  const [filterType, setFilterType] = useState(initialType); // 'all' | 'team' | 'solo'

  const { isVoteOuvert, isVoteAVenir, isVoteCloture } = useElection();
  const [projects, setProjects] = useState([]);
  const [_scrutin, setScrutin] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useEstMobile();

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projList, scrutinInfo, vStatus] = await Promise.all([
        fetchProjects(),
        fetchScrutinInfo(),
        checkVoteStatus(),
      ]);
      setProjects(projList || []);
      setScrutin(scrutinInfo);
      setVoteStatus(vStatus);
    } catch (err) {
      setError(err.message || 'Impossible de charger la galerie des projets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQ.trim()) params.set('q', searchQ.trim());
    if (filterType !== 'all') params.set('type', filterType);
    setSearchParams(params, { replace: true });
  }, [searchQ, filterType, setSearchParams]);

  const filteredProjects = useMemo(() => {
    const query = searchQ.toLowerCase().trim();

    return projects.filter((p) => {
      if (p.statut && p.statut !== PROJECT_STATUS.VALIDATED) return false;

      if (query) {
        const matchNom = p.nom?.toLowerCase().includes(query);
        const matchDesc = p.description?.toLowerCase().includes(query);
        const matchMembre = p.membres?.some((m) => m?.toLowerCase().includes(query));
        if (!matchNom && !matchDesc && !matchMembre) return false;
      }

      if (filterType === 'team') return p.membres?.length >= 2;
      if (filterType === 'solo') return p.membres?.length === 1;
      return true;
    });
  }, [projects, searchQ, filterType]);

  const isOuvert = isVoteOuvert;
  const isAVenir = isVoteAVenir;
  const isCloture = isVoteCloture;
  const hasVoted = Boolean(voteStatus?.aVote);

  const resetSearch = () => {
    setSearchQ('');
    setFilterType('all');
  };

  if (loading) {
    return <GallerySkeleton />;
  }

  return (
    <div className="gallery" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
      {/* PARCOURS EN 3 ÉTAPES (Visible si scrutin ouvert ou vote émis) */}
      <EtapesVote currentStep="galerie" visible={isOuvert || hasVoted} />

      {/* HEADER DE LA GALERIE */}
      <header
        className="gallery__header"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 'var(--space-md)',
          width: '100%',
        }}
      >
        <div>
          <span className="mono-label" style={{ color: 'var(--accent)', overflowWrap: 'break-word' }}>
            ESP · POLYHACK 2026
          </span>
          <h1 className="text-display" style={{ marginTop: '4px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            Projets en compétition
          </h1>
          <p className="gallery__subtitle" style={{ overflowWrap: 'break-word' }}>
            Consultez les projets validés par l'Administrateur.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          {isOuvert && !hasVoted && (
            <Insigne tone="success" icon="how_to_vote">
              Scrutin ouvert
            </Insigne>
          )}
          {hasVoted && (
            <Link to="/mon-recu">
              <Insigne tone="accent" icon="verified">
                Vote émis · Voir le reçu
              </Insigne>
            </Link>
          )}
          {isAVenir && (
            <Insigne tone="warn" icon="schedule">
              Scrutin à venir
            </Insigne>
          )}
          {isCloture && (
            <Insigne tone="neutral" icon="lock">
              Scrutin clos
            </Insigne>
          )}
        </div>
      </header>

      {/* BARRE D'INDICATEURS DU SCRUTIN */}
      <section className="gallery__kpi-bar" aria-label="Statistiques de la galerie" style={{ flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div className="gallery__kpi-item">
          <span className="msr msr-18" style={{ color: 'var(--accent)' }} aria-hidden="true">
            task_alt
          </span>
          <span>
            Projets validés : <strong>{projects.length}</strong>
          </span>
        </div>

        <div className="gallery__kpi-divider" aria-hidden="true" />

        <div className="gallery__kpi-item">
          <span className="msr msr-18" style={{ color: isOuvert ? 'var(--success)' : 'var(--ink-muted)' }} aria-hidden="true">
            {isOuvert ? 'campaign' : 'event'}
          </span>
          <span>
            État du scrutin :{' '}
            <strong style={{ color: isOuvert ? 'var(--success)' : 'var(--ink-muted)' }}>
              {isOuvert ? 'Vote ouvert' : isAVenir ? 'À venir' : 'Clôturé'}
            </strong>
          </span>
        </div>

        <div className="gallery__kpi-divider" aria-hidden="true" />

        <div className="gallery__kpi-item">
          <span className="msr msr-18" style={{ color: hasVoted ? 'var(--success)' : 'var(--ink-muted)' }} aria-hidden="true">
            {hasVoted ? 'verified' : 'how_to_vote'}
          </span>
          <span>
            Votre vote :{' '}
            <strong style={{ color: hasVoted ? 'var(--success)' : 'var(--ink)' }}>
              {hasVoted ? 'Enregistré' : isOuvert ? 'Disponible' : 'En attente'}
            </strong>
          </span>
        </div>
      </section>

      {/* BARRE DE RECHERCHE & FILTRES */}
      <section className="gallery__controls" style={{ width: '100%', boxSizing: 'border-box' }}>
        <div className="gallery__search-wrapper" style={{ minHeight: '44px' }}>
          <span className="msr msr-20" style={{ color: 'var(--ink-muted)' }} aria-hidden="true">
            search
          </span>
          <input
            type="text"
            className="gallery__search-input"
            placeholder="Rechercher un projet..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            aria-label="Rechercher un projet"
            autoComplete="off"
            spellCheck="false"
            style={{ minHeight: '44px', fontSize: '15px' }}
          />
          {searchQ && (
            <button
              type="button"
              onClick={() => setSearchQ('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
              }}
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
            >
              <span className="msr msr-18" aria-hidden="true">
                close
              </span>
            </button>
          )}
        </div>

        <div className="gallery__filter-tabs" role="tablist" aria-label="Filtrer les projets" style={{ flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'all'}
            className={`gallery__filter-btn ${filterType === 'all' ? 'gallery__filter-btn--active' : ''}`}
            onClick={() => setFilterType('all')}
            style={{ minHeight: '44px', padding: '8px 14px' }}
          >
            Tous ({projects.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'team'}
            className={`gallery__filter-btn ${filterType === 'team' ? 'gallery__filter-btn--active' : ''}`}
            onClick={() => setFilterType('team')}
            style={{ minHeight: '44px', padding: '8px 14px' }}
          >
            Équipes ({projects.filter((p) => (p.membres?.length || 0) >= 2).length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'solo'}
            className={`gallery__filter-btn ${filterType === 'solo' ? 'gallery__filter-btn--active' : ''}`}
            onClick={() => setFilterType('solo')}
            style={{ minHeight: '44px', padding: '8px 14px' }}
          >
            Individuels ({projects.filter((p) => (p.membres?.length || 0) === 1).length})
          </button>
        </div>
      </section>

      {/* RAPPEL D'ÉMARGEMENT */}
      {isOuvert && hasVoted && (
        <Alerte tone="info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <span>Votre vote a déjà été enregistré.</span>
            <Link to="/mon-recu" className="text-label" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>
              Consulter mon reçu
            </Link>
          </div>
        </Alerte>
      )}

      {error && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Alerte tone="err">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <span>{error}</span>
              <Bouton variant="secondary" size="sm" onClick={() => loadGallery()}>
                Réessayer
              </Bouton>
            </div>
          </Alerte>
        </div>
      )}

      {/* GRILLE DES PROJETS */}
      {projects.length === 0 ? (
        <EtatVide
          icon="folder_off"
          title="Aucun projet disponible"
          description="Aucun projet validé n'est disponible pour le moment."
          actionLabel="Actualiser"
          onAction={() => loadGallery()}
        />
      ) : filteredProjects.length === 0 ? (
        <EtatVide
          icon="search_off"
          title="Aucun résultat de recherche"
          description="Aucun projet ne correspond à votre recherche."
          actionLabel="Effacer la recherche"
          onAction={resetSearch}
        />
      ) : (
        <div className="gallery__grid">
          {filteredProjects.map((proj) => (
            <article key={proj.id} className="project-card">
              <div>
                <div className="project-card__header">
                  <h2 className="project-card__title" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{proj.nom}</h2>
                  <Insigne tone="success" icon="verified">
                    Validé
                  </Insigne>
                </div>

                <p className="project-card__desc-clamp" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{proj.description}</p>

                <div className="project-card__team-section">
                  <div className="project-card__team-label">
                    <span className="msr msr-16" aria-hidden="true">
                      group
                    </span>
                    <span>
                      {proj.membres?.length > 1
                        ? `Équipe (${proj.membres.length})`
                        : 'Porteur individuel'}
                    </span>
                  </div>
                  <div className="project-card__team-members" style={{ flexWrap: 'wrap' }}>
                    {proj.membres?.map((m, idx) => (
                      <span key={idx} className="project-card__member-tag" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '100%' }}>
                        <span className="msr msr-14" style={{ color: 'var(--ink-muted)', flexShrink: 0 }} aria-hidden="true">
                          person
                        </span>
                        <span>{m}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTIONS : LIEN VERS FICHE PROJET ET BOUTON DE VOTE RAPIDE */}
              <div className="project-card__actions" style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/projets/${proj.id}`} style={{ flex: '1 1 140px', textDecoration: 'none' }}>
                  <Bouton variant="secondary" size="md" icon="visibility" style={{ width: '100%', minHeight: '44px' }}>
                    Voir le projet
                  </Bouton>
                </Link>
                {isOuvert && !hasVoted && (
                  <Link to={`/projets/${proj.id}`} style={{ flex: '1 1 140px', textDecoration: 'none' }}>
                    <Bouton variant="primary" size="md" icon="how_to_vote" style={{ width: '100%', minHeight: '44px' }}>
                      Choisir ce projet
                    </Bouton>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
