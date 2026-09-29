import Carte from '../ui/Carte';
import Bouton from '../ui/Bouton';
import Insigne from '../ui/Insigne';
import { computeElectionPeriodStatuses } from '../../utilitaires/dateScrutin';

export default function ScrutinConfigPanel({
  formScrutin,
  setFormScrutin,
  savingScrutin,
  onSaveScrutin,
}) {
  const previewStatuses = computeElectionPeriodStatuses(formScrutin);
  return (
    <Carte>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 className="text-h2">Configuration du scrutin</h2>
        <p className="text-caption" style={{ color: 'var(--ink-muted)', marginTop: '4px' }}>
          Configurez le titre du scrutin, ainsi que les périodes de dépôt des candidatures et du déroulement du vote. Les statuts de l'urne et de la plateforme sont calculés automatiquement en fonction de ces dates.
        </p>

        {/* Aperçu dynamique en direct des statuts calculés selon les dates saisies */}
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
            Statut actuel calculé selon les dates :
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Candidatures :</span>
            <Insigne tone={previewStatuses.candidatureBadge.tone}>
              {previewStatuses.candidatureBadge.label}
            </Insigne>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Scrutin (Vote) :</span>
            <Insigne tone={previewStatuses.voteBadge.tone}>
              {previewStatuses.voteBadge.label}
            </Insigne>
          </div>
        </div>
      </div>

      <form onSubmit={onSaveScrutin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {/* 1. Titre du scrutin */}
        <div className="field">
          <label htmlFor="scrutin-titre" className="field__label" style={{ fontWeight: 600 }}>
            Titre du scrutin *
          </label>
          <div className="field__control">
            <input
              id="scrutin-titre"
              type="text"
              value={formScrutin.titre}
              onChange={(e) => setFormScrutin({ ...formScrutin, titre: e.target.value })}
              placeholder="Ex : Élection du Meilleur Projet PolyHack 2026"
              required
            />
          </div>
        </div>

        {/* 2. Période de Candidature (Dépôt des projets) */}
        <div style={{ padding: 'var(--space-md)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span className="mono-label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 'var(--space-sm)' }}>
            1. PÉRIODE DE CANDIDATURE (DÉPÔT DES PROJETS)
          </span>
          <div className="admin-grid-dates">
            <div className="field">
              <label htmlFor="candidature-debut" className="field__label" style={{ fontWeight: 600 }}>
                Date et heure de début de candidature *
              </label>
              <div className="field__control">
                <input
                  id="candidature-debut"
                  type="datetime-local"
                  value={formScrutin.candidatureDateDebut || ''}
                  onChange={(e) => setFormScrutin({ ...formScrutin, candidatureDateDebut: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="candidature-fin" className="field__label" style={{ fontWeight: 600 }}>
                Date et heure de fin de candidature *
              </label>
              <div className="field__control">
                <input
                  id="candidature-fin"
                  type="datetime-local"
                  value={formScrutin.candidatureDateFin || ''}
                  onChange={(e) => setFormScrutin({ ...formScrutin, candidatureDateFin: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Période de Vote (Scrutin) */}
        <div style={{ padding: 'var(--space-md)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span className="mono-label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 'var(--space-sm)' }}>
            2. PÉRIODE DU VOTE (SCRUTIN)
          </span>
          <div className="admin-grid-dates">
            <div className="field">
              <label htmlFor="scrutin-debut" className="field__label" style={{ fontWeight: 600 }}>
                Date et heure de début du vote *
              </label>
              <div className="field__control">
                <input
                  id="scrutin-debut"
                  type="datetime-local"
                  value={formScrutin.dateDebut || ''}
                  onChange={(e) => setFormScrutin({ ...formScrutin, dateDebut: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="scrutin-fin" className="field__label" style={{ fontWeight: 600 }}>
                Date et heure de fin du vote *
              </label>
              <div className="field__control">
                <input
                  id="scrutin-fin"
                  type="datetime-local"
                  value={formScrutin.dateFin || ''}
                  onChange={(e) => setFormScrutin({ ...formScrutin, dateFin: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enregistrer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-xs)' }}>
          <Bouton variant="primary" type="submit" loading={savingScrutin} icon="save" style={{ minHeight: '44px' }}>
            Enregistrer la configuration du scrutin
          </Bouton>
        </div>
      </form>
    </Carte>
  );
}
