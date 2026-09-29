import { useState, useMemo } from 'react';
import Carte from '../ui/Carte';
import Insigne from '../ui/Insigne';
import CsvUploadDropzone from './ZoneDepotCsv';
import { useEstMobile } from '../../hooks/useEstMobile';
import Bouton from '../ui/Bouton';
import ChampSaisie from '../ui/ChampSaisie';

export default function ElectoralListPanel({
  electoralList = [],
  importing,
  onImportSuccess,
}) {
  const isMobile = useEstMobile('(max-width: 640px)');
  const [searchQuery, setSearchQuery] = useState('');

  // Génération des statistiques de la liste électorale
  const stats = useMemo(() => {
    return {
      total: electoralList.length,
    };
  }, [electoralList]);

  // Filtrage de la liste
  const filteredList = useMemo(() => {
    return electoralList.filter((etud) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        (etud.prenom || '').toLowerCase().includes(q) ||
        (etud.nom || '').toLowerCase().includes(q) ||
        (etud.email || '').toLowerCase().includes(q) ||
        (etud.classe || '').toLowerCase().includes(q)
      );
    });
  }, [electoralList, searchQuery]);

  // Télécharger un modèle de fichier CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      'nom,prenom,classe,email\n' +
      'SENE,Abdou,DIC3-INFO,abdou.sene@esp.sn\n' +
      'DIOP,Fatou,DIC2-TR,fatou.diop@esp.sn\n' +
      'FAYE,Moussa,DUT2-INFO,moussa.faye@esp.sn\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_liste_electorale_polyhack.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      
      {/* KPI unique et moderne */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--space-md)',
        marginBottom: '4px'
      }}>
        <Carte style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--accent-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <span className="msr msr-20">group</span>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Inscrits Whitelist</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{stats.total} votants enregistrés</div>
          </div>
        </Carte>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr',
        gap: 'var(--space-md)',
        alignItems: 'start'
      }}>
        {/* Colonne gauche : Outil d'importation et téléchargement modèle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Carte>
            <CsvUploadDropzone
              loading={importing}
              existingEmails={electoralList.map((e) => e.email)}
              onImportSuccess={onImportSuccess}
            />
          </Carte>

          <Carte style={{ padding: 'var(--space-md)' }}>
            <h3 className="text-h3" style={{ fontSize: '14px', marginBottom: '8px' }}>Format du fichier attendu</h3>
            <p className="text-body" style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
              Le fichier CSV doit contenir les colonnes : <strong>nom, prenom, classe, email</strong> séparées par des virgules ou des points-virgules.
            </p>
            <Bouton
              variant="secondary"
              size="sm"
              icon="download"
              onClick={handleDownloadTemplate}
              style={{ width: '100%', minHeight: '36px' }}
            >
              Télécharger le modèle CSV
            </Bouton>
          </Carte>
        </div>

        {/* Colonne droite : Liste interactive avec recherche */}
        <Carte>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 className="text-h2" style={{ margin: 0 }}>Registre électoral</h2>
              <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
                Consultez et recherchez la whitelist des votants importés.
              </p>
            </div>
            <Insigne tone="neutral">{filteredList.length} affichés</Insigne>
          </div>

          {/* Outil de recherche */}
          <div style={{
            marginBottom: 'var(--space-md)',
            background: 'var(--bg-subtle)',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <ChampSaisie
              placeholder="Rechercher par nom, prénom, classe ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="search"
              style={{ margin: 0 }}
            />
          </div>

          {/* Rendu de la liste */}
          {filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--ink-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <span className="msr msr-32" style={{ color: 'var(--ink-subtle)', marginBottom: 'var(--space-xs)' }}>person_search</span>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '14px' }}>Aucun étudiant ne correspond à votre recherche</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Modifiez vos mots-clés de recherche.</p>
            </div>
          ) : isMobile ? (
            /* Version Cartes Empilées pour Mobile (< 640px & < 480px) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredList.map((etud, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--accent-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        fontSize: '11px',
                        flexShrink: 0
                      }}>
                        {((etud.prenom?.[0] || '') + (etud.nom?.[0] || '')).toUpperCase() || 'E'}
                      </div>
                      <span className="text-label" style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {etud.nom?.toUpperCase()} {etud.prenom}
                      </span>
                    </div>
                    <Insigne tone="success" size="sm">Inscrit</Insigne>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--ink-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="msr msr-14" style={{ color: 'var(--ink-subtle)' }}>school</span>
                      {etud.classe || 'Classe non spécifiée'}
                    </span>
                    <span className="mono-data" style={{ color: 'var(--ink-muted)', fontSize: '11px', wordBreak: 'break-all' }}>
                      {etud.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Version Desktop / Tablette (Tableau structuré) */
            <div className="table-responsive-wrapper" style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <table className="admin-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    <th>Nom & Prénom</th>
                    <th>Classe</th>
                    <th>Email institutionnel</th>
                    <th style={{ textAlign: 'right' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((etud, idx) => (
                    <tr key={idx}>
                      <td className="text-label" style={{ fontWeight: 600 }}>{etud.nom?.toUpperCase()} {etud.prenom}</td>
                      <td className="text-caption" style={{ color: 'var(--ink-muted)' }}>{etud.classe || '—'}</td>
                      <td className="mono-data" style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{etud.email}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Insigne tone="success" size="sm">Inscrit</Insigne>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      </div>
    </div>
  );
}
