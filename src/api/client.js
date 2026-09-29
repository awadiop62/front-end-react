import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('polyhack_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    let message = 'Une erreur est survenue.';
    if (data?.detail) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg || d.detail || JSON.stringify(d)).join(', ');
      }
    } else if (data?.message) {
      message = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
    } else if (status === undefined) {
      message = 'Impossible de joindre le serveur API FastAPI (Erreur réseau).';
    } else if (status === 401) {
      message = 'Session expirée ou non autorisée. Veuillez vous reconnecter.';
    } else if (status === 403) {
      message = 'Accès interdit. Vos autorisations sont insuffisantes ou vous n’êtes pas inscrit sur la liste électorale.';
    } else if (status === 404) {
      message = 'Ressource introuvable.';
    } else if (status === 409) {
      message = 'Conflit avec les règles du scrutin (ex: vote déjà émis ou dépôt fermé).';
    } else if (status === 422) {
      message = 'Données de requête invalides ou non conformes aux schémas de validation.';
    } else if (status === 423) {
      message = 'Ressource verrouillée (scrutin non clôturé ou résultats non encore publiés).';
    } else if (status === 429) {
      message = 'Trop de requêtes envoyées dans un court intervalle. Veuillez patienter quelques instants.';
    } else if (status >= 500) {
      message = 'Erreur interne du serveur backend FastAPI.';
    }

    const code = data?.code || null;
    const timestamp = data?.timestamp || new Date().toISOString();

    // Déconnexion propre et redirection en cas d'expiration du token JWT
    if (status === 401 && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('polyhack_token');
      sessionStorage.removeItem('polyhack_user');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/connexion')) {
        window.location.href = '/connexion?expired=true';
      }
    }

    return Promise.reject({ status, message, code, timestamp, raw: error });
  }
);

// Cache mémoire client (TTL) pour alléger la charge sur FastAPI
const memoryCache = new Map();

export function getCached(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

export function setCached(key, data, ttlMs = 30000) {
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearApiCache(prefix = '') {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  }
}

export function mockDelay(ms = 550) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
