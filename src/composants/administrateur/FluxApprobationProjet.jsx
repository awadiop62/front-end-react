import { useState } from 'react';
import Carte from '../ui/Carte';
import Insigne from '../ui/Insigne';
import Bouton from '../ui/Bouton';
import Alerte from '../ui/Alerte';
import Modale from '../ui/Modale';
import { useEstMobile } from '../../hooks/useEstMobile';

export default function ProjectApprovalWorkflow({ projects = [], onModerate, moderating = false, adminUser }) {
  const isMobile = useEstMobile('(max-width: 768px)');
  const [selectedProject, setSelectedProject] = useState(null);
  const [decisionAction, setDecisionAction] = useState('valider'); // 'valider' ou 'rejeter'
  const [commentaire, setCommentaire] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [error, setError] = useState(null);

  const filteredProjects = projects.filter((p) => {
    if (filterStatut === 'all') return true;
    return p.statut === filterStatut;
  });

  const pendingCount = projects.filter((p) => p.statut === 'en_attente').length;
  const validatedCount = projects.filter((p) => p.statut === 'valide').length;
  const rejectedCount = projects.filter((p) => p.statut === 'rejete').length;

  function handleOpenModal(project, action) {
    setSelectedProject(project);
    setDecisionAction(action); // 'valider' ou 'rejeter'
    setCommentaire('');
    setError(null);
    setShowEmailPreview(false);
    setModalOpen(true);
  }

  async function handleConfirmDecision() {
    if (!selectedProject) return;
    if (decisionAction === 'rejeter' && !commentaire.trim()) {
      setError('Un motif de rejet est obligatoire pour informer les candidats.');
      return;
    }

    try {
      setError(null);
      await onModerate({
        projectId: selectedProject.id,
        action: decisionAction,
        motifRejet: commentaire.trim(),
        commentaire: commentaire.trim(),
        adminName: adminUser?.nom || 'Commission IT',
      });
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Erreur lors de la modération du projet.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* En-tête de section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-sm)' }}>
        <div>
          <h2 className="text-h2" style={{ margin: 0 }}>Modération et Validation des Projets</h2>
          <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
            Consultez les propositions d'équipes et validez-les pour l'accès public au scrutin.
          </p>
        </div>
      </div>

      {/* Filtres ergonomiques sous forme de pilules */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        background: 'var(--bg-subtle)',
        padding: '6px',
        borderRadius: 'var(--radius-lg)',
        width: 'fit-content'
      }}>
        <button
          type="button"
          onClick={() => setFilterStatut('all')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: filterStatut === 'all' ? 'var(--surface)' : 'transparent',
            color: filterStatut === 'all' ? 'var(--accent)' : 'var(--ink-muted)',
            boxShadow: filterStatut === 'all' ? 'var(--shadow-e1)' : 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
        >
          Tous ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatut('en_attente')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: filterStatut === 'en_attente' ? 'var(--surface)' : 'transparent',
            color: filterStatut === 'en_attente' ? '#b45309' : 'var(--ink-muted)',
            boxShadow: filterStatut === 'en_attente' ? 'var(--shadow-e1)' : 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
        >
          ⏱ En attente ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatut('valide')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: filterStatut === 'valide' ? 'var(--surface)' : 'transparent',
            color: filterStatut === 'valide' ? '#047857' : 'var(--ink-muted)',
            boxShadow: filterStatut === 'valide' ? 'var(--shadow-e1)' : 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
        >
          ✓ Validés ({validatedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatut('rejete')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: filterStatut === 'rejete' ? 'var(--surface)' : 'transparent',
            color: filterStatut === 'rejete' ? '#b91c1c' : 'var(--ink-muted)',
            boxShadow: filterStatut === 'rejete' ? 'var(--shadow-e1)' : 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
        >
          ✕ Rejetés ({rejectedCount})
        </button>
      </div>

      {filteredProjects.length === 0 ? (
        <Carte style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <span className="msr msr-32" style={{ color: 'var(--ink-subtle)', marginBottom: 'var(--space-xs)' }}>folder_open</span>
          <p className="text-body-lg" style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>
            Aucun projet trouvé
          </p>
          <p className="text-caption" style={{ color: 'var(--ink-subtle)', marginTop: '4px' }}>
            Aucune soumission ne correspond au filtre sélectionné actuellement.
          </p>
        </Carte>
      ) : (
        /* Grille optimisée réactive */
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {filteredProjects.map((project) => {
            const isValidated = project.statut === 'valide';
            const isRejected = project.statut === 'rejete';

            return (
              <Carte key={project.id} style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
                padding: 'var(--space-md)',
                borderLeft: isValidated ? '4px solid var(--success)' : isRejected ? '4px solid var(--err-icon)' : '4px solid #f59e0b',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}>
                <div>
                  {/* Badge & Titre */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <h3 className="text-h3" style={{ margin: 0, color: 'var(--ink)', fontSize: '15px', fontWeight: 700 }}>
                      {project.nom}
                    </h3>
                    <Insigne
                      tone={
                        isValidated ? 'success' : isRejected ? 'danger' : 'warn'
                      }
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    >
                      {isValidated ? 'Validé' : isRejected ? 'Rejeté' : 'En attente'}
                    </Insigne>
                  </div>

                  {/* Description détaillée */}
                  <p className="text-body" style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: 'var(--space-sm)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description}
                  </p>

                  {/* Membres de l'équipe */}
                  <div style={{
                    background: 'var(--bg-subtle)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    border: '1px solid var(--border)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    <strong style={{ color: 'var(--ink)' }}>👨‍💻 Équipe ({Array.isArray(project.membres) ? project.membres.length : 1}) :</strong>
                    <div style={{ color: 'var(--ink-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                      {Array.isArray(project.membres) ? project.membres.join(', ') : project.membres}
                    </div>
                  </div>

                  {/* Contact mail porteur */}
                  {project.porteurEmail && (
                    <div style={{ fontSize: '11px', color: 'var(--ink-subtle)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <span className="msr msr-14">mail</span>
                      <span>Porteur : {project.porteurEmail}</span>
                    </div>
                  )}

                  {/* Message de rejet si disponible */}
                  {isRejected && project.motifRejet && (
                    <div style={{
                      background: 'var(--err-bg)',
                      color: 'var(--err-text)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      marginTop: '8px',
                      border: '1px solid var(--err-icon)'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="msr msr-16">warning</span> Motif du rejet :
                      </div>
                      <div>{project.motifRejet}</div>
                    </div>
                  )}
                </div>

                {/* Actions disponibles uniquement pour les projets en attente */}
                {project.statut === 'en_attente' && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    borderTop: '1px solid var(--border)',
                    paddingTop: 'var(--space-sm)',
                    marginTop: 'auto'
                  }}>
                    <Bouton
                      type="button"
                      tone="accent"
                      size="sm"
                      style={{ flex: 1, minHeight: '38px', fontWeight: 600 }}
                      onClick={() => handleOpenModal(project, 'valider')}
                    >
                      ✓ Valider
                    </Bouton>
                    <Bouton
                      type="button"
                      tone="danger"
                      size="sm"
                      style={{ flex: 1, minHeight: '38px', fontWeight: 600 }}
                      onClick={() => handleOpenModal(project, 'rejeter')}
                    >
                      ✕ Rejeter
                    </Bouton>
                  </div>
                )}
              </Carte>
            );
          })}
        </div>
      )}

      {/* Modal de confirmation de modération (avec variables corrigées) */}
      <Modale
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={decisionAction === 'valider' ? 'Validation du Projet' : 'Rejet du Projet'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: '4px' }}>
          <p className="text-body" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            Vous vous apprêtez à <strong>{decisionAction === 'valider' ? 'valider et inscrire' : 'rejeter officiellement'}</strong> le projet{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>« {selectedProject?.nom} »</span>.
          </p>

          {error && <Alerte tone="danger">{error}</Alerte>}

          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="moderation-comment" className="field__label" style={{ fontWeight: 600, fontSize: '13px' }}>
              {decisionAction === 'rejeter'
                ? 'Motif du rejet (Obligatoire · Sera communiqué à l’équipe par email) :'
                : 'Commentaire de validation / Remarque à l’équipe (Optionnel) :'}
            </label>
            <textarea
              id="moderation-comment"
              rows={4}
              className="field__input"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                fontSize: '13px',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder={decisionAction === 'rejeter' ? 'Exemple : Membres manquants, ou titre inapproprié...' : 'Exemple : Félicitations pour l’idée ! Projet validé.'}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              required={decisionAction === 'rejeter'}
            />
          </div>

          {/* Section d'aperçu de l'email */}
          <div style={{ marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent)',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
                fontWeight: 600,
              }}
            >
              <span className="msr msr-16">{showEmailPreview ? 'visibility_off' : 'mail'}</span>
              {showEmailPreview ? 'Masquer l’aperçu du mail de décision' : 'Voir le modèle de notification e-mail'}
            </button>

            {showEmailPreview && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  border: '1px solid var(--border)',
                  lineHeight: 1.5
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="msr msr-14" style={{ color: 'var(--accent)' }}>send</span> Destinataire : {selectedProject?.porteurEmail || 'porteur@esp.sn'}
                </div>
                <div style={{ color: 'var(--ink-muted)', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
                  <p style={{ margin: 0 }}><strong>Objet :</strong> Décision de l'administrateur PolyHack concernant votre projet</p>
                  <p style={{ margin: '8px 0 0' }}>
                    Bonjour <strong>{selectedProject?.membres?.[0] || 'Candidat'}</strong>,
                  </p>
                  <p style={{ margin: '4px 0 0' }}>
                    Votre projet <strong>« {selectedProject?.nom} »</strong> a été{' '}
                    {decisionAction === 'valider' ? (
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>VALIDÉ</span>
                    ) : (
                      <span style={{ color: 'var(--err-text)', fontWeight: 700 }}>REJETÉ</span>
                    )}{' '}
                    par l'administrateur PolyHack.
                  </p>
                  {commentaire && (
                    <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--accent)', fontStyle: 'italic' }}>
                      « {commentaire} »
                    </div>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--ink-subtle)' }}>
                    Cordialement,<br />
                    L'administrateur PolyHack
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action du Modal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-sm)' }}>
            <Bouton type="button" tone="neutral" onClick={() => setModalOpen(false)} disabled={moderating}>
              Annuler
            </Bouton>
            <Bouton
              type="button"
              tone={decisionAction === 'valider' ? 'accent' : 'danger'}
              loading={moderating}
              onClick={handleConfirmDecision}
              style={{ fontWeight: 600 }}
            >
              {decisionAction === 'valider' ? 'Confirmer la Validation' : 'Confirmer le Rejet'}
            </Bouton>
          </div>
        </div>
      </Modale>
    </div>
  );
}
