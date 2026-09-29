import Carte from '../ui/Carte';
import Insigne from '../ui/Insigne';
import Bouton from '../ui/Bouton';
import { useEstMobile } from '../../hooks/useEstMobile';

export default function UrneExportPanel({ exportingUrne, onExportUrne }) {
  const isMobile = useEstMobile('(max-width: 480px)');

  return (
    <Carte>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ minWidth: '220px', flex: 1 }}>
          <h2 className="text-h2" style={{ margin: 0 }}>Exporter l'urne (Liste des reçus)</h2>
          <p className="text-caption" style={{ color: 'var(--ink-muted)', marginTop: '4px' }}>
            Export anonymisé de l'urne (reçu de vote + choix associé, sans identité d'électeur).
          </p>
        </div>
        <Insigne tone="accent">Audit & Contrôle</Insigne>
      </div>

      <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '13px', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
        Téléchargez la liste intégrale des bulletins scellés dans l’urne électronique sous format CSV pour vérification indépendante ou audit par l'Administrateur.
      </p>

      <div style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%'
      }}>
        <Bouton
          variant="primary"
          size="md"
          icon="download"
          loading={exportingUrne}
          onClick={onExportUrne}
          style={{ width: isMobile ? '100%' : 'auto', minHeight: '44px' }}
        >
          Exporter l'urne anonymisée (CSV)
        </Bouton>
        <Bouton
          variant="secondary"
          size="md"
          icon="print"
          onClick={() => window.print()}
          style={{ width: isMobile ? '100%' : 'auto', minHeight: '44px' }}
        >
          Imprimer l'état d'émargement (PDF)
        </Bouton>
      </div>
    </Carte>
  );
}
