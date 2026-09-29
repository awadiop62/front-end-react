import { apiClient, USE_MOCKS, mockDelay, clearApiCache } from './client';
import { ELECTION_STATUS, PROJECT_STATUS, ERROR_CODES } from '../types/models';

/**
 * Construit une clé de stockage local isolée par utilisateur et par scrutin
 * Exemple : polyhack_receipt_etudiant1%40esp.sn_scrutin-polyhack-2026
 */
export function getReceiptStorageKey(scrutinId = 'scrutin-polyhack-2026') {
  try {
    const rawUser = sessionStorage.getItem('polyhack_user');
    if (!rawUser) return null;
    const user = JSON.parse(rawUser);
    const identifier = user?.id || user?.email ? String(user.id || user.email).toLowerCase().trim() : null;
    if (!identifier) return null;
    return `polyhack_receipt_${encodeURIComponent(identifier)}_${scrutinId}`;
  } catch {
    return null;
  }
}

function generateReceiptCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `PH26-${time}-${random}`;
}

export async function checkVoteStatus() {
  const receiptKey = getReceiptStorageKey();

  if (USE_MOCKS) {
    await mockDelay(200);
    if (!receiptKey) return { aVote: false };
    const stored = localStorage.getItem(receiptKey);
    return stored ? { aVote: true, ...JSON.parse(stored) } : { aVote: false };
  }

  // Intégration FastAPI réelle : Le serveur est la source de vérité absolue
  const { data } = await apiClient.get('/vote/statut');
  if (data?.aVote) {
    if (data.recu && data.horodatage && receiptKey) {
      localStorage.setItem(
        receiptKey,
        JSON.stringify({ recu: data.recu, horodatage: data.horodatage })
      );
    }
    const stored = receiptKey ? localStorage.getItem(receiptKey) : null;
    const storedParsed = stored ? JSON.parse(stored) : {};
    return {
      aVote: true,
      recu: data.recu || storedParsed.recu || null,
      horodatage: data.horodatage || storedParsed.horodatage || null,
    };
  }

  // Si le serveur confirme qu'aucun vote n'a été émis pour cet utilisateur, on nettoie
  if (receiptKey) {
    localStorage.removeItem(receiptKey);
  }
  return { aVote: false };
}

export async function castVote(projectId) {
  const receiptKey = getReceiptStorageKey();

  if (USE_MOCKS) {
    const { getMockScrutin, getMockProjects, addMockUrneVote } = await import('./mocks/mockData');
    await mockDelay(600);
    const scrutin = getMockScrutin();

    if (scrutin.statut !== ELECTION_STATUS.OPEN) {
      const err = new Error("Le scrutin n'est pas ouvert au vote actuellement.");
      err.status = 409;
      err.code = ERROR_CODES.ELECTION_NOT_OPEN;
      throw err;
    }

    if (receiptKey && localStorage.getItem(receiptKey)) {
      const err = new Error('Un vote a déjà été enregistré pour ce compte électoral.');
      err.status = 409;
      err.code = ERROR_CODES.ALREADY_VOTED;
      throw err;
    }

    const project = getMockProjects().find((p) => p.id === projectId);
    if (!project || project.statut !== PROJECT_STATUS.VALIDATED) {
      const err = new Error('Ce projet ne fait pas partie des projets validés.');
      err.status = 400;
      err.code = ERROR_CODES.PROJECT_INVALID;
      throw err;
    }

    project.voix = (project.voix || 0) + 1;

    const receipt = {
      recu: generateReceiptCode(),
      horodatage: new Date().toISOString(),
    };

    addMockUrneVote(receipt.recu, project.nom, receipt.horodatage);

    // Secret du vote :
    // On conserve uniquement l'identifiant cryptographique scellé et l'horodatage.
    // Aucun identifiant de projet (projectId / projetNom) n'est stocké localement.
    if (receiptKey) {
      localStorage.setItem(
        receiptKey,
        JSON.stringify({ recu: receipt.recu, horodatage: receipt.horodatage })
      );
    }

    clearApiCache('projects');
    return receipt;
  }

  // Intégration FastAPI réelle :
  // Aucun fallback silencieux sur les mocks en cas d'erreur backend en production.
  const { data } = await apiClient.post('/vote', { projetId: projectId });

  // Sauvegarde sécurisée et anonymisée du reçu d'émargement sous la clé isolée
  if (receiptKey && data?.recu) {
    localStorage.setItem(
      receiptKey,
      JSON.stringify({
        recu: data.recu,
        horodatage: data.horodatage,
      })
    );
  }

  clearApiCache('projects');
  return data;
}

export function clearUserReceipt(scrutinId = 'scrutin-polyhack-2026') {
  try {
    const key = getReceiptStorageKey(scrutinId);
    if (key) {
      localStorage.removeItem(key);
    }
    // Nettoyage de l'ancienne clé générique si présente
    localStorage.removeItem('polyhack_receipt_scrutin-polyhack-2026');
  } catch {
    // Ignore
  }
}
