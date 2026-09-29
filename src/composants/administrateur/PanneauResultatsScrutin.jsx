import Carte from '../ui/Carte';
import Insigne from '../ui/Insigne';
import Bouton from '../ui/Bouton';
import Alerte from '../ui/Alerte';

export default function ElectionResultsPanel({
  scrutin,
  projects,
  publishing,
  onTogglePublish,
}) {
  const isCloture = scrutin?.statut === 'cloture' || (scrutin?.dateFin && new Date() >= new Date(scrutin.dateFin));

  if (!isCloture) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <Carte>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <div>
              <h2 className="text-h2">Consulter les résultats</h2>
              <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
                Les résultats ne sont pas accessibles avant la clôture automatique du scrutin à la date de fin programmée.
              </p>
            </div>
            <Insigne tone="warn">Scrutin en cours</Insigne>
          </div>

          <Alerte tone="warn">
            <strong>Consultation bloquée pendant la période de vote :</strong> Le dépouillement et le calcul des résultats s'effectueront dès que la date et l'heure de fin du scrutin seront atteintes.
          </Alerte>
        </Carte>
      </div>
    );
  }

  const valids = projects.filter((p) => p.statut === 'valide');
  const totalVoix = valids.reduce((sum, p) => sum + (p.voix || 0), 0);
  const ranked = [...valids]
    .sort((a, b) => (b.voix || 0) - (a.voix || 0))
    .map((p) => ({
      ...p,
      pct: totalVoix > 0 ? Math.round(((p.voix || 0) / totalVoix) * 1000) / 10 : 0,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <Carte>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <div>
            <h2 className="text-h2">Résultats officiels du scrutin</h2>
            <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
              Dépouillement certifié de l'urne et classement des projets validés.
            </p>
          </div>
          <Insigne tone="success">Scrutin clos</Insigne>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
            <span className="mono-label">TOTAL DES BULLETINS EXPRIMÉS :</span>
            <span className="mono-data" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '15px' }}>{totalVoix} votes</span>
          </div>

          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Projet</th>
                  <th>Membres de l'équipe</th>
                  <th style={{ textAlign: 'right' }}>Suffrages (Voix)</th>
                  <th style={{ textAlign: 'right' }}>Pourcentage</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => (
                  <tr key={p.id}>
                    <td className="mono-data" style={{ fontWeight: 700 }}>#{i + 1}</td>
                    <td className="text-label" style={{ fontWeight: 600 }}>{p.nom}</td>
                    <td className="text-caption" style={{ color: 'var(--ink-muted)' }}>
                      {Array.isArray(p.membres) ? p.membres.join(', ') : '—'}
                    </td>
                    <td className="mono-data" style={{ textAlign: 'right', fontWeight: 600 }}>{p.voix || 0}</td>
                    <td className="mono-data" style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>{p.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Carte>

      {/* Publication officielle */}
      <Carte>
        <h2 className="text-h2" style={{ marginBottom: '8px' }}>Publication des résultats</h2>
        <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '13px', marginBottom: 'var(--space-md)' }}>
          Rend les résultats consultables publiquement par les électeurs après clôture.
        </p>
        <Bouton
          variant={scrutin?.resultatsPublies ? 'secondary' : 'primary'}
          icon={scrutin?.resultatsPublies ? 'visibility_off' : 'publish'}
          loading={publishing}
          onClick={onTogglePublish}
        >
          {scrutin?.resultatsPublies ? 'Masquer les résultats' : 'Publier officiellement les résultats'}
        </Bouton>
      </Carte>
    </div>
  );
}
