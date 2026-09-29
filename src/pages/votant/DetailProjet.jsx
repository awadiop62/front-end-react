import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProjectById, fetchScrutinInfo } from '../../api/projectsService';
import { castVote, checkVoteStatus } from '../../api/voteService';
import { useToast } from '../../contextes/ContexteToast';
import { useElection } from '../../contextes/ContexteScrutin';
import { useEstMobile } from '../../hooks/useEstMobile';
import { PROJECT_STATUS, ERROR_CODES } from '../../types/models';
import Carte from '../../composants/ui/Carte';
import Bouton from '../../composants/ui/Bouton';
import Alerte from '../../composants/ui/Alerte';
import Modale from '../../composants/ui/Modale';
import Insigne from '../../composants/ui/Insigne';
import EtatVide from '../../composants/ui/EtatVide';
import { ProjectDetailSkeleton } from '../../composants/ui/Squelette';
import EtapesVote from '../../composants/votant/EtapesVote';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { refreshElection, isVoteOuvert, isVoteAVenir, isVoteCloture } = useElection();
  const isMobile = useEstMobile();

  const [project, setProject] = useState(null);
  const [scrutin, setScrutin] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [proj, scr, st] = await Promise.all([
        fetchProjectById(id),
        fetchScrutinInfo(),
        checkVoteStatus(),
      ]);
      setProject(proj);
      setScrutin(scr);
      setVoteStatus(st);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function handleConfirmVote() {
    if (submitting || !project) return;
    try {
      setSubmitting(true);
      const res = await castVote(project.id);
      refreshElection();
      showToast('Vote enregistré. Redirection vers votre reçu…', { variant: 'success' });
      navigate('/mon-recu', { state: { receipt: res } });
    } catch (err) {
      if (err.code === ERROR_CODES.ALREADY_VOTED) {
        setVoteStatus({ aVote: true });
        refreshElection();
        showToast('Vous avez déjà voté lors de ce scrutin.', { variant: 'warn' });
        setModalOpen(false);
      } else if (err.code === ERROR_CODES.ELECTION_NOT_OPEN || err.code === ERROR_CODES.ELECTION_CLOSED) {
        refreshElection();
        showToast(err.message || 'Le scrutin n’est pas ouvert.', { variant: 'err' });
        setModalOpen(false);
      } else if (err.status === undefined) {
        try {
          const statusCheck = await checkVoteStatus();
          if (statusCheck?.aVote) {
            setVoteStatus(statusCheck);
            refreshElection();
            showToast("Votre vote a bien été enregistré malgré l'interruption réseau", { variant: 'success' });
            setModalOpen(false);
            navigate('/mon-recu');
            return;
          }
        } catch {
          // Ignorer l'erreur secondaire et retomber sur le toast d'erreur
        }
        showToast(err.message || 'Erreur lors de l’enregistrement du vote.', { variant: 'err' });
      } else {
        showToast(err.message || 'Erreur lors de l’enregistrement du vote.', { variant: 'err' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseModal() {
    if (submitting) return;
    setModalOpen(false);
  }

  if (loading) return <ProjectDetailSkeleton />;

  // Erreur : projet introuvable
  if (error?.code === ERROR_CODES.PROJECT_NOT_FOUND || (!project && !error)) {
    return (
      <div className="project-detail" style={{ maxWidth: '840px', width: '100%', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
        <EtatVide
          icon="search_off"
          title="Projet introuvable"
          description="Le projet demandé n'existe pas ou n'a pas été homologué par l'Administrateur."
          actionLabel="Retour à la galerie des projets"
          onAction={() => navigate('/galerie')}
        />
      </div>
    );
  }

  // Erreur réseau ou technique
  if (error) {
    return (
      <div className="project-detail" style={{ maxWidth: '840px', width: '100%', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
        <Alerte tone="err">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <span>{error.message || 'Impossible de charger la fiche du projet.'}</span>
            <Bouton variant="secondary" size="sm" onClick={loadProject} style={{ minHeight: '44px' }}>
              Réessayer
            </Bouton>
          </div>
        </Alerte>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <Bouton variant="ghost" size="md" icon="arrow_back" onClick={() => navigate('/galerie')} style={{ minHeight: '44px' }}>
            Retour à la galerie
          </Bouton>
        </div>
      </div>
    );
  }

  const isOuvert = isVoteOuvert;
  const isCloture = isVoteCloture;
  const isAVenir = isVoteAVenir;
  const isValide = project.statut === PROJECT_STATUS.VALIDATED;
  const hasVoted = Boolean(voteStatus?.aVote);
  const canVote = isOuvert && !hasVoted && isValide;

  return (
    <div className="project-detail" style={{ maxWidth: '840px', width: '100%', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
      {/* STEPPER DE PROGRESSION */}
      <EtapesVote
        currentStep="confirmation"
        isLocked={!canVote && !hasVoted}
        visible={isOuvert || hasVoted || !canVote}
      />

      {/* BOUTON RETOUR ET ACCÈS AU VOTE (Pile verticale pleine largeur sous 480px) */}
      <div
        className="project-detail__top-nav"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '8px',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-md)',
          width: '100%',
        }}
      >
        {canVote && (
          <Bouton
            variant="primary"
            size="md"
            icon="how_to_vote"
            onClick={() => setModalOpen(true)}
            style={{
              minHeight: '44px',
              fontWeight: 600,
              width: isMobile ? '100%' : 'auto',
              order: isMobile ? 1 : 2,
            }}
          >
            Voter pour ce projet
          </Bouton>
        )}
        <Link
          to="/galerie"
          style={{
            width: isMobile ? '100%' : 'auto',
            display: isMobile ? 'block' : 'inline-block',
            order: isMobile ? 2 : 1,
          }}
        >
          <Bouton
            variant="secondary"
            size="md"
            icon="arrow_back"
            style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}
          >
            Retour à la galerie des projets
          </Bouton>
        </Link>
      </div>

      {/* EN-TÊTE D'IDENTITÉ DU PROJET */}
      <header
        className="project-detail__header"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
          width: '100%',
        }}
      >
        <div>
          <span className="mono-label" style={{ color: 'var(--accent)', overflowWrap: 'break-word' }}>
            PROJET HOMOLOGUÉ · POLYHACK 2026
          </span>
          <h1 className="text-display" style={{ marginTop: '4px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {project.nom}
          </h1>
          {project.filiere && (
            <div style={{ marginTop: '6px' }}>
              <span className="mono-label" style={{ color: 'var(--ink-muted)', fontSize: '12px' }}>
                Filière / Département : <strong>{project.filiere}</strong>
              </span>
            </div>
          )}
        </div>
        <div>
          <Insigne
            tone={isValide ? 'success' : project.statut === PROJECT_STATUS.PENDING ? 'warn' : 'err'}
            icon={isValide ? 'verified' : project.statut === PROJECT_STATUS.PENDING ? 'hourglass_empty' : 'cancel'}
          >
            {isValide
              ? 'Projet validé'
              : project.statut === PROJECT_STATUS.PENDING
              ? 'En cours de modération'
              : 'Projet rejeté'}
          </Insigne>
        </div>
      </header>

      {/* DESCRIPTION DÉTAILLÉE DU PROJET */}
      <Carte className="project-detail__desc-card" style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <h2 className="text-h3" style={{ marginBottom: 'var(--space-sm)' }}>
          Description du projet
        </h2>
        <p className="text-body-lg" style={{ lineHeight: 1.7, color: 'var(--ink)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          {project.description}
        </p>
      </Carte>

      {/* COMPOSITION DE L'ÉQUIPE */}
      <Carte className="project-detail__members-card" style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="text-h3">Membres de l'équipe</h2>
          <span className="mono-label" style={{ color: 'var(--ink-muted)' }}>
            {project.membres?.length > 1 ? `${project.membres.length} membres` : 'Porteur individuel'}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          {project.membres?.map((m, idx) => (
            <div
              key={idx}
              className="badge badge--neutral"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border)',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              <span className="msr msr-18" style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true">
                person
              </span>
              <span style={{ fontWeight: 600 }}>{m}</span>
            </div>
          ))}
        </div>
      </Carte>

      {/* BLOC D'ACTION PRINCIPAL : SOUTENIR CE PROJET */}
      <section className="project-detail__vote-section" style={{ width: '100%' }}>
        {canVote && (
          <Carte
            style={{
              borderLeft: '4px solid var(--accent)',
              padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-md)',
              backgroundColor: 'var(--surface-raised)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div>
              <span className="mono-label" style={{ color: 'var(--accent)' }}>
                ACTION ÉLECTEUR
              </span>
              <h3 className="text-h2" style={{ margin: '4px 0', overflowWrap: 'break-word' }}>
                Soutenir le projet « {project.nom} »
              </h3>
              <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '14px', overflowWrap: 'break-word' }}>
                Votre suffrage unique sera scellé dans l’urne sous anonymat et vous délivrera votre reçu officiel.
              </p>
            </div>
            <Bouton
              variant="primary"
              size="md"
              icon="how_to_vote"
              onClick={() => setModalOpen(true)}
              style={{ minHeight: '48px', padding: '0 24px', fontSize: '14px', width: isMobile ? '100%' : 'auto' }}
            >
              Voter pour ce projet
            </Bouton>
          </Carte>
        )}

        {!isValide && (
          <Alerte tone="warn">
            {project.statut === PROJECT_STATUS.PENDING
              ? 'Ce projet est en cours de modération par l\'Administrateur. Il ne peut pas recevoir de votes.'
              : 'Ce projet n’a pas été retenu pour le scrutin public.'}
          </Alerte>
        )}

        {hasVoted && (
          <Alerte tone="info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <span>
                Votre participation a bien été enregistrée pour ce scrutin. Votre bulletin est scellé dans l’urne.
              </span>
              <Link to="/mon-recu" className="text-label" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>
                Consulter mon reçu
              </Link>
            </div>
          </Alerte>
        )}

        {isAVenir && isValide && (
          <Alerte tone="accent">
            Le scrutin n’a pas encore commencé. L’ouverture des votes aura lieu le {new Date(scrutin?.dateDebut).toLocaleString('fr-FR')}.
          </Alerte>
        )}

        {isCloture && isValide && (
          <Alerte tone="warn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <span>Le scrutin est clos. L’émission des votes est terminée.</span>
              <Link to="/resultats" className="text-label" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>
                Consulter les résultats
              </Link>
            </div>
          </Alerte>
        )}
      </section>

      {/* MODAL DE CONFIRMATION DU VOTE */}
      <Modale
        open={modalOpen}
        onClose={handleCloseModal}
        icon="how_to_vote"
        title="Confirmer votre vote"
        description="Vous êtes sur le point d’enregistrer votre vote pour :"
        confirmLabel={submitting ? 'Enregistrement de votre vote…' : 'Confirmer mon vote'}
        cancelLabel="Annuler"
        onConfirm={handleConfirmVote}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        confirmDisabled={submitting}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <span className="mono-label" style={{ color: 'var(--accent)' }}>
              VOTE DÉFINITIF
            </span>
            <h3 className="text-h2" style={{ margin: '4px 0', color: 'var(--ink)' }}>
              {project.nom}
            </h3>
            <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
              {project.membres?.join(', ')}
            </p>
          </div>

          <p className="text-body" style={{ color: 'var(--err-text)', fontWeight: 600, fontSize: '13px' }}>
            Cette action est définitive pour ce scrutin.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--accent-bg)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span className="msr msr-18" style={{ color: 'var(--accent)', marginTop: '2px' }} aria-hidden="true">
              lock
            </span>
            <span className="text-caption" style={{ color: 'var(--ink)' }}>
              {scrutin?.secret
                ? 'Secret de l’urne garanti : Votre choix reste strictement anonyme. Aucun lien direct ne relie votre identité à votre vote.'
                : 'Vote scellé et sécurisé par le protocole d’émargement PolyHack.'}
            </span>
          </div>

          {submitting && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: 'var(--space-sm)',
                color: 'var(--accent)',
                fontSize: '13px',
              }}
            >
              <span className="btn__spinner" aria-hidden="true" />
              <span>Enregistrement de votre vote… Redirection vers votre reçu officiel.</span>
            </div>
          )}
        </div>
      </Modale>
    </div>
  );
}
