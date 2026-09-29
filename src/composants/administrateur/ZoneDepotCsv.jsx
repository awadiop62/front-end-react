import { useState, useRef } from 'react';
import { useToast } from '../../contextes/ContexteToast';
import { parseAndValidateCsv } from '../../utilitaires/analyseurCsv';
import Bouton from '../ui/Bouton';
import Alerte from '../ui/Alerte';

export default function CsvUploadDropzone({ loading = false, onImportSuccess }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [csvText, setCsvText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [parsedPreview, setParsedPreview] = useState([]);

  const SAMPLE_CSV = `nom,prenom,email
Faye,Serigne Fallou,serigne.faye@esp.sn
Ndiaye,Awa,awa.ndiaye@esp.sn
Diop,Cheikh,cheikh.diop@esp.sn
Sarr,Fatou,fatou.sarr@esp.sn
Sy,Ibrahima,ibrahima.sy@esp.sn
Diallo,Khady,khady.diallo@esp.sn`;

  function parseCsvContent(text) {
    setError(null);
    setWarnings([]);
    if (!text || !text.trim()) {
      setParsedPreview([]);
      return;
    }

    const result = parseAndValidateCsv(text);
    if (!result.isValid && result.errors?.length > 0) {
      setError(result.errors.join(' | '));
      setParsedPreview(result.records || []);
    } else {
      setParsedPreview(result.records || []);
      if (result.warnings?.length > 0) {
        setWarnings(result.warnings.slice(0, 3));
      }
    }
  }

  function handleTextChange(e) {
    const val = e.target.value;
    setCsvText(val);
    parseCsvContent(val);
  }

  function handleFileRead(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setError('Veuillez sélectionner un fichier au format .CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      setCsvText(content);
      parseCsvContent(content);
    };
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier.');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  }

  function handleLoadSample() {
    setCsvText(SAMPLE_CSV);
    parseCsvContent(SAMPLE_CSV);
    showToast('Modèle CSV officiel chargé.', { variant: 'info' });
  }

  async function handleImport() {
    if (!csvText.trim()) {
      setError('Veuillez fournir du contenu CSV à importer.');
      return;
    }
    if (parsedPreview.length === 0) {
      setError('Aucune entrée valide détectée dans le CSV (format requis : nom, prenom, email).');
      return;
    }

    setError(null);
    try {
      if (onImportSuccess) {
        await onImportSuccess(csvText, parsedPreview);
      }
      setCsvText('');
      setParsedPreview([]);
    } catch (err) {
      setError(err.message || "Erreur lors de l'importation de la liste.");
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="text-h2" style={{ margin: 0 }}>Importer la liste électorale</h2>
          <p className="text-caption" style={{ color: 'var(--ink-muted)', marginTop: '2px' }}>
            Fichier CSV avec colonnes requises : <code>nom, prenom, email</code>
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: '12px',
            color: 'var(--accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span className="msr msr-16">content_paste</span>
          Charger modèle exemple
        </button>
      </div>

      {error && (
        <Alerte tone="danger">
          <span>{error}</span>
        </Alerte>
      )}

      {warnings && warnings.length > 0 && (
        <Alerte tone="warn">
          <div>
            <strong>Avertissements détectés :</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {warnings.map((w, idx) => (
                <li key={idx} style={{ fontSize: '12px' }}>{w}</li>
               ))}
            </ul>
          </div>
        </Alerte>
      )}

      {/* Zone Drag & Drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-lg)',
          textAlign: 'center',
          background: dragOver ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileRead(e.target.files[0]);
            }
          }}
        />
        <span className="msr msr-32" style={{ color: 'var(--ink-muted)' }}>upload_file</span>
        <p className="text-body" style={{ margin: '8px 0 4px', fontWeight: 600 }}>
          Glissez-déposez votre fichier .CSV ici, ou cliquez pour parcourir
        </p>
        <span className="text-caption" style={{ color: 'var(--ink-subtle)' }}>
          Encodage UTF-8 recommandé · Séparateur virgule ou point-virgule
        </span>
      </div>

      {/* Saisie textuelle directe */}
      <div>
        <label htmlFor="csv-direct-textarea" className="field__label">Ou collez le contenu brut CSV :</label>
        <textarea
          id="csv-direct-textarea"
          rows={4}
          className="field__input"
          placeholder="nom,prenom,email..."
          value={csvText}
          onChange={handleTextChange}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
        />
      </div>

      {/* Aperçu des entrées détectées */}
      {parsedPreview.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
          <span className="mono-label" style={{ color: 'var(--success)', display: 'block', marginBottom: '4px' }}>
            ✓ {parsedPreview.length} étudiant(s) prêt(s) à être importé(s)
          </span>
          <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '12px' }}>
            {parsedPreview.slice(0, 5).map((etud, idx) => (
              <div key={idx} style={{ padding: '2px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <strong>{etud.prenom} {etud.nom}</strong>
                <span style={{ color: 'var(--accent)' }}>{etud.email}</span>
              </div>
            ))}
            {parsedPreview.length > 5 && (
              <span style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                ... et {parsedPreview.length - 5} autre(s)
              </span>
            )}
          </div>
        </div>
      )}

      <Bouton
        type="button"
        tone="accent"
        loading={loading}
        disabled={loading || parsedPreview.length === 0}
        onClick={handleImport}
        style={{ width: '100%' }}
      >
        Valider et importer la liste électorale ({parsedPreview.length})
      </Bouton>
    </div>
  );
}
