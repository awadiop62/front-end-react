import { useEffect, useState, useCallback } from 'react';
import { submitProject, fetchScrutinInfo, fetchMyProjects } from '../../api/projectsService';
import { useToast } from '../../contextes/ContexteToast';
import { useElection } from '../../contextes/ContexteScrutin';
import { useAuth } from '../../contextes/ContexteAuth';
import { useEstMobile } from '../../hooks/useEstMobile';
import { formatPeriodDate } from '../../utilitaires/dateScrutin';
import Carte from '../../composants/ui/Carte';
import ChampSaisie from '../../composants/ui/ChampSaisie';
import ZoneTexte from '../../composants/ui/ZoneTexte';
import Bouton from '../../composants/ui/Bouton';
import Insigne from '../../composants/ui/Insigne';
import Alerte from '../../composants/ui/Alerte';
import { PageSpinner } from '../../composants/ui/Squelette';

export default function SubmitProject() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    refreshElection,
    isDepotOuvert,
    isVoteOuvert,
    isCandidatureAVenir,
    candidatureDateDebut,
    candidatureDateFin,
  } = useElection();
  const isMobile = useEstMobile();

  const [scrutin, setScrutin] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [membres, setMembres] = useState(['']);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  // État de succès après soumission pour un retour visuel soigné
  const [submittedProject, setSubmittedProject] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const [s, mine] = await Promise.all([
        fetchScrutinInfo(),
        fetchMyProjects().catch(() => []),
      ]);
      setScrutin(s);
      const safeMine = Array.isArray(mine)
        ? mine
        : Array.isArray(mine?.projects)
        ? mine.projects
        : Array.isArray(mine?.data)
        ? mine.data
        : [];
      setMyProjects(safeMine);
    } catch {
      // Ignorer l'erreur silencieusement
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleMemberChange(idx, val) {
    const next = [...membres];
    next[idx] = val;
    setMembres(next);
  }

  function addMember() {
    setMembres([...membres, '']);
  }

  function removeMember(idx) {
    if (membres.length <= 1) return;
    setMembres(membres.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!nom.trim()) newErrors.nom = 'Le nom du projet est obligatoire.';
    if (!description.trim()) {
      newErrors.description = 'La description détaillée du projet est obligatoire.';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Veuillez décrire votre projet plus en détail (au moins 20 caractères).';
    }

    const validMembers = membres.map((m) => m.trim()).filter(Boolean);
    if (validMembers.length === 0) {
      newErrors.membres = 'Indiquez au moins un membre de l’équipe.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Veuillez compléter les champs obligatoires du formulaire.', { variant: 'err' });
      return;
    }

    try {
      setLoading(true);
      const res = await submitProject({
        nom: nom.trim(),
        description: description.trim(),
        membres: validMembers,
      });
      setSubmittedProject(res);
      await loadData();
      refreshElection();
      showToast('Votre projet a été déposé avec succès auprès de l\'Administrateur.', {
        variant: 'success',
      });
    } catch (err) {
      showToast(err.message || 'Erreur lors du dépôt du projet.', { variant: 'err' });
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return <PageSpinner label="Chargement de l’espace soumission de projet…" />;
  }

  // Si le scrutin est en phase de vote, la soumission est suspendue conformément au règlement
  if (isVoteOuvert) {
    return (
      <div className="submit-project" style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <header style={{ marginBottom: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="mono-label" style={{ color: 'var(--accent)' }}>ESPACE CANDIDATURE · SOUMISSION DE PROJET</span>
            <span style={{ color: 'var(--ink-subtle)' }}>•</span>
            <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>{user?.prenom} {user?.nom}</span>
          </div>
          <h1 className="text-display">Soumission de Projet</h1>
        </header>

        <Carte style={{ padding: 'var(--space-xl)' }}>
          <Alerte tone="warn">
            <strong>Période de soumission suspendue :</strong> La phase de vote est en cours. Conformément aux règles officielles du scrutin, la soumission de nouveaux projets est suspendue pendant le déroulement du vote.
          </Alerte>
        </Carte>

        {Array.isArray(myProjects) && myProjects.length > 0 && renderMyProjectsList(myProjects)}
      </div>
    );
  }

  // Si la période de candidature n'est pas ouverte
  if (!isDepotOuvert) {
    return (
      <div className="submit-project" style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <header style={{ marginBottom: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="mono-label" style={{ color: 'var(--accent)' }}>ESPACE CANDIDATURE · SOUMISSION DE PROJET</span>
            <span style={{ color: 'var(--ink-subtle)' }}>•</span>
            <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>{user?.prenom} {user?.nom}</span>
          </div>
          <h1 className="text-display">Soumission de Projet</h1>
        </header>

        <Carte style={{ padding: 'var(--space-xl)' }}>
          <Alerte tone={isCandidatureAVenir ? 'info' : 'warn'}>
            <strong>{isCandidatureAVenir ? 'Période de candidature à venir :' : 'Période de candidature fermée :'}</strong>{' '}
            {isCandidatureAVenir
              ? 'Le dépôt de projet n’a pas encore commencé pour ce scrutin.'
              : 'La période de dépôt de candidature est actuellement fermée ou expirée.'}
            {(candidatureDateDebut || scrutin?.candidatureDateDebut) && (
              <div style={{ marginTop: '8px', fontSize: '13px' }}>
                Période officielle : du {formatPeriodDate(candidatureDateDebut || scrutin?.candidatureDateDebut)} au {formatPeriodDate(candidatureDateFin || scrutin?.candidatureDateFin)}.
              </div>
            )}
          </Alerte>
        </Carte>

        {Array.isArray(myProjects) && myProjects.length > 0 && renderMyProjectsList(myProjects)}
      </div>
    );
  }

  // Écran de succès post-soumission
  if (submittedProject) {
    return (
      <div className="submit-project" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <Carte style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-lg)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--accent-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-md)',
            }}
          >
            <span className="msr msr-32" style={{ color: 'var(--accent)' }} aria-hidden="true">
              check_circle
            </span>
          </div>

          <span className="mono-label" style={{ color: 'var(--accent)' }}>PROJET TRANSMIS AVEC SUCCÈS</span>
          <h1 className="text-h1" style={{ marginTop: '4px', marginBottom: '8px' }}>
            Projet « {submittedProject.nom} » enregistré !
          </h1>
          <p className="text-body" style={{ color: 'var(--ink-muted)', maxWidth: '480px', margin: '0 auto var(--space-lg)' }}>
            Votre dossier a bien été reçu et porte le statut <Insigne tone="accent">En attente de modération</Insigne>.
            L’Administrateur examinera votre fiche avant de la valider pour la galerie publique du scrutin.
          </p>

          <div style={{ textAlign: 'left', padding: 'var(--space-md)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
            <span className="mono-label" style={{ display: 'block', marginBottom: '6px' }}>RÉCAPITULATIF DU PROJET DÉPOSÉ</span>
            <h3 className="text-h3" style={{ marginBottom: '4px' }}>{submittedProject.nom}</h3>
            <p className="text-body" style={{ color: 'var(--ink-muted)', marginBottom: '12px', fontSize: '14px' }}>
              {submittedProject.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {submittedProject.membres?.map((m, idx) => (
                <span key={idx} className="badge badge--neutral" style={{ fontSize: '12px' }}>
                  <span className="msr msr-16" aria-hidden="true">person</span>
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Bouton
              variant="primary"
              icon="add"
              onClick={() => {
                setSubmittedProject(null);
                setNom('');
                setDescription('');
                setMembres(['']);
              }}
              style={{ minHeight: '44px' }}
            >
              Soumettre un autre projet
            </Bouton>
          </div>
        </Carte>
      </div>
    );
  }

  const validMembersCount = membres.filter((m) => m.trim()).length;

  return (
    <div className="submit-project" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? 'var(--space-md)' : 'var(--space-lg)' }}>
      <header style={{ marginBottom: 'var(--space-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span className="mono-label" style={{ color: 'var(--accent)', letterSpacing: '0.04em' }}>ESPACE CANDIDATURE · POLYHACK 2026</span>
          <span style={{ color: 'var(--ink-subtle)' }}>•</span>
          <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>{user?.prenom} {user?.nom}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h1 className="text-display" style={{ fontSize: isMobile ? '22px' : '28px', margin: 0 }}>
            Soumission de Projet
          </h1>
          <Insigne tone="success" icon="check_circle">
            Période de soumission active
          </Insigne>
        </div>
        <p className="text-body" style={{ color: 'var(--ink-muted)', marginTop: '6px', fontSize: isMobile ? '13.5px' : '14px', lineHeight: 1.5 }}>
          Remplissez le formulaire ci-dessous pour enregistrer votre projet d'équipe PolyHack. Il sera modéré par l'Administrateur avant sa publication officielle.
        </p>
      </header>

      <div className="submit-project__grid">
        {/* Colonne 1 : Formulaire de dépôt */}
        <Carte style={{ padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            {/* Section 1: Informations du projet */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-2xs)' }}>
              <span className="mono-label" style={{ color: 'var(--accent)', fontSize: '11px' }}>
                1. INFORMATIONS DU PROJET
              </span>
            </div>

            <div>
              <ChampSaisie
                label="Nom du projet *"
                placeholder="Ex. AquaSense, GreenGrid, EduLink"
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  setErrors((prev) => ({ ...prev, nom: null }));
                }}
                error={errors.nom}
                icon="lightbulb"
                required
              />
              <span className="text-caption" style={{ color: 'var(--ink-muted)', marginTop: '4px', display: 'block', fontSize: '12px' }}>
                Un nom court et représentatif pour identifier votre solution.
              </span>
            </div>

            <div>
              <ZoneTexte
                label="Description détaillée & Solution *"
                placeholder="Expliquez la problématique ciblée, la technologie mise en œuvre et l'impact de votre projet..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((prev) => ({ ...prev, description: null }));
                }}
                error={errors.description}
                rows={isMobile ? 4 : 5}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', alignItems: 'center' }}>
                <span className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: '12px' }}>
                  Au moins 20 caractères recommandés.
                </span>
                <span className="mono-data" style={{ fontSize: '11px', color: description.length >= 20 ? 'var(--success)' : 'var(--ink-subtle)' }}>
                  {description.length} car.
                </span>
              </div>
            </div>

            {/* Section 2: Membres de l'équipe */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-xs)', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-2xs)' }}>
              <span className="mono-label" style={{ color: 'var(--accent)', fontSize: '11px' }}>
                2. ÉQUIPE & MEMBRES
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <label className="text-label" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Membres de l'équipe ({validMembersCount})
                </label>
                <Bouton
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="add"
                  onClick={addMember}
                  style={{ minHeight: '36px', padding: '0 10px', fontSize: '12px' }}
                >
                  Ajouter un membre
                </Bouton>
              </div>

              <div className="submit-project__members-list">
                {membres.map((m, idx) => (
                  <div key={idx} className="submit-project__member-row">
                    <div style={{ flex: 1 }}>
                      <ChampSaisie
                        placeholder="Prénom et Nom (ex. Awa Ndiaye)"
                        value={m}
                        onChange={(e) => {
                          handleMemberChange(idx, e.target.value);
                          setErrors((prev) => ({ ...prev, membres: null }));
                        }}
                        icon="person"
                      />
                    </div>
                    {membres.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(idx)}
                        className="submit-project__remove-btn"
                        title="Retirer ce membre"
                        aria-label="Retirer ce membre"
                      >
                        <span className="msr msr-20" aria-hidden="true">delete_outline</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.membres && (
                <span className="field__message field__message--error" style={{ marginTop: '6px', display: 'block' }}>
                  {errors.membres}
                </span>
              )}
            </div>

            {/* Bouton de bascule de l'aperçu en mode mobile */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setShowPreviewMobile((prev) => !prev)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  marginTop: 'var(--space-xs)',
                }}
              >
                <span className="msr msr-18" aria-hidden="true">
                  {showPreviewMobile ? 'visibility_off' : 'visibility'}
                </span>
                <span>{showPreviewMobile ? "Masquer l'aperçu mobile" : "Afficher l'aperçu du projet"}</span>
              </button>
            )}

            <div className="submit-project__actions" style={{ marginTop: 'var(--space-xs)' }}>
              <Bouton
                type="submit"
                variant="primary"
                icon="send"
                loading={loading}
                style={{ minHeight: '48px', width: '100%', fontSize: '15px', fontWeight: 600 }}
              >
                Soumettre le projet
              </Bouton>
            </div>
          </form>
        </Carte>

        {/* Colonne 2 : Aperçu en direct (Masqué sur mobile sauf si activé) */}
        {(!isMobile || showPreviewMobile) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Carte style={{ borderTop: '4px solid var(--accent)', padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-sm)' }}>
                <span className="msr msr-18" style={{ color: 'var(--accent)' }} aria-hidden="true">visibility</span>
                <span className="mono-label" style={{ color: 'var(--accent)' }}>APERÇU DU PROJET</span>
              </div>

              <div style={{ padding: 'var(--space-md)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <h3 className="text-h3" style={{ color: nom.trim() ? 'var(--ink)' : 'var(--ink-muted)', margin: 0, fontSize: '16px' }}>
                    {nom.trim() || 'Titre de votre projet'}
                  </h3>
                  <Insigne tone="accent">En attente</Insigne>
                </div>

                <p className="text-body" style={{ color: description.trim() ? 'var(--ink)' : 'var(--ink-muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '12px' }}>
                  {description.trim() || 'La description de votre projet apparaîtra ici telle que les électeurs la liront.'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {membres.filter((m) => m.trim()).length > 0 ? (
                    membres.filter((m) => m.trim()).map((m, idx) => (
                      <span key={idx} className="badge badge--neutral" style={{ fontSize: '11px' }}>
                        <span className="msr msr-16" aria-hidden="true">person</span>
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-caption" style={{ color: 'var(--ink-subtle)', fontStyle: 'italic', fontSize: '12px' }}>
                      Aucun membre renseigné
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-md)' }}>
                <span className="mono-label" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>RÈGLES DE VALIDATION</span>
                <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                  <li>Votre projet est enregistré avec le statut <strong>En attente</strong>.</li>
                  <li>Il sera visible dans la galerie après validation par l'Administrateur.</li>
                  <li>En cas de rejet, un motif sera précisé par l'administrateur.</li>
                </ul>
              </div>
            </Carte>
          </div>
        )}
      </div>

      {/* Vos projets déjà soumis avec suivi en direct */}
      {Array.isArray(myProjects) && myProjects.length > 0 && renderMyProjectsList(myProjects, isMobile)}
    </div>
  );
}

function renderMyProjectsList(projects, isMobile = false) {
  const safeList = Array.isArray(projects)
    ? projects
    : Array.isArray(projects?.projects)
    ? projects.projects
    : Array.isArray(projects?.data)
    ? projects.data
    : [];

  if (safeList.length === 0) return null;

  return (
    <Carte style={{ marginTop: 'var(--space-md)', padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '6px' }}>
        <div>
          <h2 className="text-h2" style={{ fontSize: isMobile ? '18px' : '20px', margin: 0 }}>Vos projets soumis ({safeList.length})</h2>
          <p className="text-caption" style={{ color: 'var(--ink-muted)', marginTop: '2px' }}>
            Suivi en temps réel de la modération par l'Administrateur.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {safeList.map((p) => {
          const isValide = p.statut === 'valide';
          const isEnAttente = p.statut === 'en_attente';
          const isRejete = p.statut === 'rejete';
          const membresList = Array.isArray(p.membres)
            ? p.membres
            : typeof p.membres === 'string'
            ? p.membres.split(',').map((m) => m.trim()).filter(Boolean)
            : [];

          return (
            <div
              key={p.id}
              style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <h3 className="text-h3" style={{ fontSize: '16px', margin: 0 }}>{p.nom}</h3>
                <Insigne tone={isValide ? 'success' : isEnAttente ? 'accent' : 'err'}>
                  {isValide ? 'Validé · En lice' : isEnAttente ? 'En attente de modération' : 'Rejeté'}
                </Insigne>
              </div>

              <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '13.5px', marginBottom: '10px', lineHeight: 1.5 }}>
                {p.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                {membresList.map((m, idx) => (
                  <span key={idx} className="badge badge--neutral" style={{ fontSize: '11px' }}>
                    <span className="msr msr-16" aria-hidden="true">person</span>
                    {m}
                  </span>
                ))}
              </div>

              {isRejete && p.motifRejet && (
                <div style={{ padding: '8px 12px', background: 'var(--err-bg, #fee2e2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--err, #ef4444)', marginTop: '8px' }}>
                  <span className="mono-label" style={{ color: 'var(--err, #ef4444)', display: 'block', fontSize: '11px' }}>
                    MOTIF DU REJET PAR L'ADMINISTRATEUR
                  </span>
                  <p style={{ color: 'var(--ink)', fontSize: '13px', margin: '4px 0 0 0' }}>
                    {p.motifRejet}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Carte>
  );
}
