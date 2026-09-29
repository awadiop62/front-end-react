import { useEffect, useState, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { checkVoteStatus } from '../../api/voteService';
import { useAuth } from '../../contextes/ContexteAuth';
import { useToast } from '../../contextes/ContexteToast';
import { useEstMobile } from '../../hooks/useEstMobile';
import { generateSignedReceiptPdf } from '../../utilitaires/generateurRecuPdf';
import Carte from '../../composants/ui/Carte';
import Bouton from '../../composants/ui/Bouton';
import Insigne from '../../composants/ui/Insigne';
import Alerte from '../../composants/ui/Alerte';
import EtatVide from '../../composants/ui/EtatVide';
import { PageSpinner } from '../../composants/ui/Squelette';
import EtapesVote from '../../composants/votant/EtapesVote';

function formatFrenchDate(isoString) {
  if (!isoString) return { date: '—', heure: '—' };
  const d = new Date(isoString);
  const dateStr = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return { date: dateStr, heure: timeStr };
}

export default function Receipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isMobile = useEstMobile();

  const isFreshVote = Boolean(location.state?.receipt);

  const [status, setStatus] = useState(
    location.state?.receipt ? { aVote: true, ...location.state.receipt } : null
  );
  const [loading, setLoading] = useState(!location.state?.receipt);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadStatus = useCallback(async () => {
    if (location.state?.receipt) return;
    try {
      setLoading(true);
      setError(null);
      const st = await checkVoteStatus();
      setStatus(st);
    } catch (err) {
      setError(err);
      showToast(err.message || 'Erreur lors de la récupération du reçu.', { variant: 'err' });
    } finally {
      setLoading(false);
    }
  }, [location.state?.receipt, showToast]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function handleCopy() {
    if (!status?.recu) return;
    try {
      navigator.clipboard?.writeText(status.recu);
      setCopied(true);
      showToast('Numéro de reçu copié !', { variant: 'success' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Impossible de copier automatiquement.', { variant: 'err' });
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    if (!status?.recu) return;
    try {
      setGeneratingPdf(true);
      await generateSignedReceiptPdf({
        receiptNumber: status.recu,
        scrutinTitle: 'Scrutin PolyHack 2026',
        voterName: `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Étudiant',
        voterClass: user?.classe || '',
        voterEmail: user?.email || '',
        projectName: status.projetNom || '',
        timestamp: status.horodatage || status.dateVote || new Date().toISOString(),
      });
      showToast('Reçu PDF officiel PolyHack 2026 téléchargé.', { variant: 'success' });
    } catch {
      showToast('Erreur lors de la génération du PDF.', { variant: 'err' });
    } finally {
      setGeneratingPdf(false);
    }
  }

  if (loading) return <PageSpinner label="Récupération de votre reçu officiel…" />;

  if (error) {
    return (
      <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', padding: '0 12px', boxSizing: 'border-box' }}>
        <Alerte tone="err">
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', width: '100%', gap: '8px' }}>
            <span>{error.message || 'Impossible de récupérer votre reçu.'}</span>
            <Bouton variant="secondary" size="sm" onClick={loadStatus} style={{ minHeight: '40px', width: isMobile ? '100%' : 'auto' }}>
              Réessayer
            </Bouton>
          </div>
        </Alerte>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <Bouton variant="ghost" size="md" icon="home" onClick={() => navigate('/hub')} style={{ minHeight: '44px', width: isMobile ? '100%' : 'auto' }}>
            Accueil du scrutin
          </Bouton>
        </div>
      </div>
    );
  }

  if (!status || !status.aVote) {
    return (
      <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', padding: '0 12px', boxSizing: 'border-box' }}>
        <EtatVide
          icon="how_to_vote"
          title="Aucun vote émis"
          description="Vous n'avez pas encore émis de vote pour ce scrutin."
          actionLabel="Accéder à la galerie des projets"
          onAction={() => navigate('/galerie')}
        />
      </div>
    );
  }

  const { date, heure } = formatFrenchDate(status.horodatage);

  return (
    <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', padding: '0 12px', boxSizing: 'border-box' }}>
      <EtapesVote currentStep="recu" visible={true} />

      {isFreshVote && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Alerte tone="success">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="msr msr-20" aria-hidden="true">check_circle</span>
              <strong style={{ fontSize: isMobile ? '13px' : '14px' }}>Vote enregistré avec succès !</strong>
            </div>
          </Alerte>
        </div>
      )}

      {/* CARTE OFFICIELLE DU REÇU */}
      <Carte
        style={{
          borderTop: '4px solid var(--accent)',
          padding: isMobile ? '16px' : '24px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* En-tête officiel */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
            marginBottom: '16px',
            gap: '8px',
          }}
        >
          <div>
            <span className="mono-label" style={{ color: 'var(--accent)', fontSize: '11px', display: 'block' }}>
              POLYHACK 2026
            </span>
            <h1 className="text-h2" style={{ margin: '2px 0 0', fontSize: isMobile ? '20px' : '22px' }}>
              Reçu de Vote
            </h1>
          </div>
          <Insigne tone="success" icon="verified">
            Validé
          </Insigne>
        </div>

        {/* Bloc Numéro de Reçu */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: '11px', fontWeight: 600 }}>
              NUMÉRO DE REÇU
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: copied ? 'var(--success-bg)' : 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                color: copied ? 'var(--success)' : 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <span className="msr msr-14" aria-hidden="true">{copied ? 'check' : 'content_copy'}</span>
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '0.5px',
            }}
          >
            {status.recu || 'PH26-AUDIT-VALID'}
          </div>
        </div>

        {/* Grille des données précises */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Scrutin</span>
            <strong style={{ color: 'var(--ink)' }}>Scrutin PolyHack 2026</strong>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Votant</span>
            <strong style={{ color: 'var(--ink)' }}>
              {user ? `${user.prenom} ${user.nom}${user.classe ? ' (' + user.classe + ')' : ''}` : 'Électeur'}
            </strong>
          </div>

          {user?.email && (
            <>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-muted)' }}>E-mail</span>
                <span style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{user.email}</span>
              </div>
            </>
          )}

          {status.projetNom && (
            <>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Projet choisi</span>
                <strong style={{ color: 'var(--accent)' }}>{status.projetNom}</strong>
              </div>
            </>
          )}

          <div style={{ height: '1px', background: 'var(--border)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Date & Heure</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{date} à {heure}</span>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Statut</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Enregistré & Validé</span>
          </div>
        </div>

        {/* Signature officielle PolyHack 2026 */}
        <div
          style={{
            padding: '12px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <span className="mono-label" style={{ fontSize: '10px', color: 'var(--ink-muted)', display: 'block' }}>
            SIGNATURE OFFICIELLE
          </span>
          <strong style={{ fontSize: '16px', color: 'var(--accent)', display: 'block', marginTop: '2px' }}>
            Signé PolyHack 2026
          </strong>
        </div>

        {/* Actions principales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Bouton
            variant="primary"
            size="md"
            icon="picture_as_pdf"
            loading={generatingPdf}
            onClick={handleDownloadPdf}
            style={{ width: '100%', minHeight: '44px', justifyContent: 'center' }}
          >
            Télécharger le Reçu PDF
          </Bouton>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Bouton
              variant="secondary"
              size="md"
              icon="print"
              onClick={handlePrint}
              style={{ width: '100%', minHeight: '40px', justifyContent: 'center' }}
            >
              Imprimer
            </Bouton>
            <Link to="/resultats" style={{ textDecoration: 'none' }}>
              <Bouton
                variant="secondary"
                size="md"
                icon="leaderboard"
                style={{ width: '100%', minHeight: '40px', justifyContent: 'center' }}
              >
                Résultats
              </Bouton>
            </Link>
          </div>
        </div>
      </Carte>
    </div>
  );
}
