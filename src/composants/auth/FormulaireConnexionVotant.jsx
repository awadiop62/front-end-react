import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contextes/ContexteAuth';
import { useToast } from '../../contextes/ContexteToast';
import { USE_MOCKS } from '../../api/client';
import { ERROR_CODES } from '../../types/models';
import Bouton from '../ui/Bouton';
import Alerte from '../ui/Alerte';
import Modale from '../ui/Modale';

const DEMO_ACCOUNTS = [
  { email: 'demo.electeur1@esp.sn', nom: 'Amadou Fall', classe: '', role: 'Électeur' },
  { email: 'demo.candidat@esp.sn', nom: 'Awa Ndiaye', classe: '', role: 'Porteuse de projet' },
  { email: 'demo.electeur2@esp.sn', nom: 'Cheikh Diop', classe: '', role: 'Électeur' },
  { email: 'demo.electeur3@esp.sn', nom: 'Fatou Sarr', classe: '', role: 'Électrice' },
];

export default function VoterLoginForm({ onSuccess }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const isGoogleConfigured = Boolean(googleClientId);

  const [selectedDemo, setSelectedDemo] = useState(USE_MOCKS ? 'demo.electeur1@esp.sn' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Nettoyage géré de façon ciblée lors de la réinitialisation explicite
  // Aucune suppression intempestive du reçu lors du simple affichage du formulaire

  async function performDemoLogin(targetEmail) {
    const rawEmail = typeof targetEmail === 'object' && targetEmail !== null ? (targetEmail.email || '') : targetEmail;
    const emailToUse = String(rawEmail || selectedDemo || '').trim().toLowerCase();
    if (!emailToUse) return;

    setError(null);
    setErrorDetails(null);
    setLoading(true);

    try {
      const loggedUser = await login({ email: emailToUse });
      showToast(
        `Connecté en tant que ${loggedUser.prenom || ''} ${loggedUser.nom || ''}`.trim() || 'Connexion réussie',
        { variant: 'success' }
      );
      if (onSuccess) {
        onSuccess(loggedUser);
      }
    } catch (err) {
      if (err.code === ERROR_CODES.WHITELIST_DENIED || err.status === 403) {
        setError('Accès refusé. Adresse e-mail non inscrite sur la liste électorale.');
        setErrorDetails(err.message);
      } else {
        setError(err.message || 'Erreur lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    if (!credentialResponse?.credential) {
      setError("Impossible d'obtenir votre identité Google, réessayez");
      return;
    }

    setError(null);
    setErrorDetails(null);
    setLoading(true);

    try {
      // Transmet le vrai ID Token cryptographiquement signé reçu de Google Identity Services
      const loggedUser = await login({ idToken: credentialResponse.credential });
      showToast(
        `Connecté avec Google : ${loggedUser.prenom || ''} ${loggedUser.nom || ''}`.trim() || 'Authentification Google réussie',
        { variant: 'success' }
      );
      if (onSuccess) {
        onSuccess(loggedUser);
      }
    } catch (err) {
      if (err.code === ERROR_CODES.WHITELIST_DENIED || err.status === 403) {
        setError('Accès refusé. Votre compte Google ne figure pas sur la liste électorale importée.');
        setErrorDetails(err.message);
      } else {
        setError(err.message || "Impossible d'obtenir votre identité Google, réessayez");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setError("Impossible d'obtenir votre identité Google, réessayez");
  }

  async function handleConfirmReset() {
    if (USE_MOCKS) {
      const { resetMockState } = await import('../../api/mocks/mockData');
      resetMockState();
    }
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('polyhack_receipt_') || k.startsWith('polyhack_vote_')) {
          localStorage.removeItem(k);
        }
      });
      sessionStorage.removeItem('polyhack_mode_choisi');
    } catch {
      // Ignore
    }
    setShowResetConfirmModal(false);
    showToast('Toutes les données de vote et comptes démos ont été réinitialisées à zéro.', { variant: 'success' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xs)' }}>
        <h2 className="text-h2" style={{ margin: 0 }}>
          Connexion Électeur & Candidat
        </h2>
        <p className="text-caption" style={{ color: 'var(--ink-muted)', marginTop: '4px' }}>
          {USE_MOCKS
            ? 'Authentifiez-vous avec votre compte Google ou sélectionnez un compte démo.'
            : 'Authentifiez-vous avec votre compte Google institutionnel (@esp.sn).'}
        </p>
      </div>

      {error && (
        <Alerte tone="danger">
          <div>
            <strong>{error}</strong>
            {errorDetails && <p style={{ margin: '4px 0 0', fontSize: '12px' }}>{errorDetails}</p>}
          </div>
        </Alerte>
      )}

      {/* GESTION DU BOUTON GOOGLE VS ALERTE CONFIGURATION MANQUANTE */}
      {isGoogleConfigured ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              locale="fr"
              width="100%"
            />
          </div>
        </div>
      ) : USE_MOCKS ? (
        <Alerte tone="warn">
          <div>
            <strong>Configuration Google en attente</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
              La connexion Google n'est pas encore configurée sur cet environnement (VITE_GOOGLE_CLIENT_ID manquant). Utilisez un compte de démonstration ci-dessous en attendant.
            </p>
          </div>
        </Alerte>
      ) : (
        <Alerte tone="danger">
          <div>
            <strong>Connexion Google non configurée</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
              La connexion Google n'est pas encore configurée sur cet environnement (VITE_GOOGLE_CLIENT_ID manquant). Veuillez configurer cette variable dans le fichier d'environnement pour activer l'authentification.
            </p>
          </div>
        </Alerte>
      )}

      {/* COMPTES DÉMOS ET RÉINITIALISATION (UNIQUEMENT VISIBLES EN MODE USE_MOCKS) */}
      {USE_MOCKS && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '8px 0',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span className="mono-label" style={{ fontSize: '10px', color: 'var(--ink-subtle)' }}>
              COMPTES DE DÉMONSTRATION
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <div
            style={{
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="mono-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>
                CHOISIR UN COMPTE DE DÉMONSTRATION
              </span>
              <span className="text-caption" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                Cliquez pour sélectionner
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedDemo === acc.email;
                return (
                  <div
                    key={acc.email}
                    onClick={() => setSelectedDemo(acc.email)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--accent-bg)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: isSelected ? 'var(--accent)' : 'var(--ink)' }}>
                        {acc.nom}
                      </strong>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isSelected ? 'var(--accent)' : 'var(--bg-subtle)',
                          color: isSelected ? '#fff' : 'var(--ink-muted)',
                          fontWeight: 600,
                        }}
                      >
                        {acc.role}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{acc.email}</span>
                    <span style={{ fontSize: '10px', color: 'var(--ink-subtle)' }}>Promotion : {acc.classe}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Bouton
            type="button"
            tone="accent"
            loading={loading}
            onClick={() => performDemoLogin(selectedDemo)}
            style={{ width: '100%', minHeight: '44px', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}
          >
            <span className="msr msr-20" aria-hidden="true">login</span>
            <span>Se connecter avec {selectedDemo}</span>
          </Bouton>

          {/* Bouton de réinitialisation avec confirmation préalable */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span className="text-caption" style={{ color: 'var(--ink-subtle)', fontSize: '11px' }}>
              Mode Démo · Environnement simulé
            </span>
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--err, #dc2626)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
              title="Remettre à zéro tous les votes et reçus de démonstration"
            >
              <span className="msr msr-14" aria-hidden="true">refresh</span>
              <span>Réinitialiser les votes démos (à zéro)</span>
            </button>
          </div>

          {/* Modal de confirmation de réinitialisation */}
          <Modale
            open={showResetConfirmModal}
            onClose={() => setShowResetConfirmModal(false)}
            title="Confirmer la réinitialisation"
            description="Êtes-vous certain de vouloir réinitialiser l'ensemble des données de test et des votes simulés à zéro ? Cette action est irréversible pour la session de test locale."
            confirmLabel="Réinitialiser à zéro"
            cancelLabel="Annuler"
            tone="danger"
            onConfirm={handleConfirmReset}
          />
        </>
      )}
    </div>
  );
}
