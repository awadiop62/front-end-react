import { apiClient, USE_MOCKS, mockDelay } from './client';
import { USER_ROLES, ERROR_CODES } from '../types/models';
import { clearUserReceipt } from './voteService';

const TOKEN_KEY = 'polyhack_token';
const USER_KEY = 'polyhack_user';

/**
 * Décode en toute sécurité un jeton JWT ou payload Google
 * @param {string} token
 * @returns {object|null}
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    }
  } catch {
    // Si format non standard
  }
  return null;
}

/**
 * Génère un jeton JWT signé simulé pour l'environnement de dev/prototype
 * @param {object} user
 * @returns {string}
 */
function generateMockJwt(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const nowSec = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      sub: user.id || `usr-${user.email}`,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      classe: user.classe,
      role: user.role,
      iat: nowSec,
      exp: nowSec + 7200, // 2 heures de validité
      iss: 'polyhack-auth-service',
      aud: 'polyhack-voter-app',
      jti: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
    })
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const signature = btoa(`polyhack_sig_${user.email}_${nowSec}`)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${header}.${payload}.${signature}`;
}

/**
 * Authentification Administrateur sécurisée avec Code d'Accès Commission IT
 * @param {object} params
 * @param {string} [params.email]
 * @param {string} params.passcode
 * @returns {Promise<{ token: string, user: object, token_type: string, expires_at: number }>}
 */
export async function loginAdminApi({ email = 'admin.commission-it@esp.sn', passcode }) {
  const cleanPasscode = String(passcode || '').trim();
  if (!cleanPasscode) {
    const err = new Error("Veuillez saisir le code d'accès administrateur Commission IT.");
    err.status = 400;
    throw err;
  }

  // 1. Intégration FastAPI réelle
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/auth/admin-login', {
      email: email.trim(),
      passcode: cleanPasscode,
    });
    const token = data.access_token || data.token;
    const user = data.user;
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return {
      token,
      token_type: data.token_type || 'bearer',
      expires_at: data.expires_at || null,
      user,
    };
  }

  // 2. Mode mock local pour développement/tests
  await mockDelay(400);

  if (cleanPasscode !== 'ESP2026') {
    const err = new Error("Code d'accès administrateur invalide.");
    err.status = 401;
    throw err;
  }

  const { mockAdminUser } = await import('./mocks/mockData');
  const adminToken = generateMockJwt(mockAdminUser);
  sessionStorage.setItem(TOKEN_KEY, adminToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(mockAdminUser));

  return {
    token: adminToken,
    token_type: 'bearer',
    expires_at: Date.now() + 7200 * 1000,
    user: mockAdminUser,
  };
}

/**
 * Authentification d'un électeur via Google SSO ou connexion directe électorale
 * 
 * @param {object} params
 * @param {string} [params.email] - Adresse e-mail institutionnelle
 * @param {string} [params.idToken] - Jeton Google ID Token signé
 * @returns {Promise<{ token: string, user: object, token_type: string, expires_at: number }>}
 */
export async function loginApi({ email = '', idToken = '' }) {
  let emailNorm = '';
  let googlePayload = null;

  if (idToken) {
    googlePayload = parseJwt(idToken);
    if (googlePayload?.email) {
      emailNorm = googlePayload.email.trim().toLowerCase();
    }
  }

  if (!emailNorm && email) {
    const rawEmail = typeof email === 'object' && email !== null ? (email.email || '') : email;
    emailNorm = String(rawEmail || '').trim().toLowerCase();
  }

  if (!emailNorm && !idToken) {
    const err = new Error("Veuillez vous authentifier avec votre compte Google institutionnel.");
    err.status = 400;
    throw err;
  }

  // 1. Intégration FastAPI réelle
  if (!USE_MOCKS) {
    let endpoint = '/auth/google';
    let payload = {};

    if (idToken) {
      endpoint = '/auth/google';
      payload = { id_token: idToken, credential: idToken };
    } else {
      endpoint = '/auth/voter-login';
      payload = { email: emailNorm };
    }

    const { data } = await apiClient.post(endpoint, payload);
    const token = data.access_token || data.token;
    const user = data.user;

    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    return {
      token,
      token_type: data.token_type || 'bearer',
      expires_at: data.expires_at || null,
      user,
    };
  }

  // 2. Mode mock local pour développement/tests
  const {
    mockAdminUser,
    mockElectoralList,
    getMockElectoralList,
    mockUtilisateurWhitelist,
  } = await import('./mocks/mockData');
  await mockDelay(500);

  // Accès Administrateur Direct (mock uniquement)
  if (emailNorm === mockAdminUser.email.toLowerCase()) {
    const adminToken = generateMockJwt(mockAdminUser);
    sessionStorage.setItem(TOKEN_KEY, adminToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(mockAdminUser));
    return {
      token: adminToken,
      token_type: 'bearer',
      expires_at: Date.now() + 7200 * 1000,
      user: mockAdminUser,
    };
  }

  // Vérification de la liste électorale importée (Whitelist)
  const currentList = getMockElectoralList ? getMockElectoralList() : mockElectoralList;
  const voter =
    currentList.find((e) => e.email.toLowerCase() === emailNorm) ||
    (emailNorm === mockUtilisateurWhitelist.email.toLowerCase() ? mockUtilisateurWhitelist : null);

  if (!voter) {
    const err = new Error(
      `Accès refusé : L'adresse « ${emailNorm || 'Google'} » ne figure pas sur la liste électorale importée par la Commission IT.`
    );
    err.status = 403;
    err.code = ERROR_CODES.WHITELIST_DENIED;
    throw err;
  }

  const effectiveRole = voter.role || USER_ROLES.STUDENT;
  const userData = {
    id: voter.id || `usr-${voter.email.split('@')[0]}`,
    email: voter.email,
    nom: voter.nom || googlePayload?.family_name || googlePayload?.name || '',
    prenom: voter.prenom || googlePayload?.given_name || '',
    classe: voter.classe || '',
    role: effectiveRole,
    avatar: googlePayload?.picture || null,
  };

  const jwtToken = generateMockJwt(userData);
  sessionStorage.setItem(TOKEN_KEY, jwtToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(userData));

  return {
    token: jwtToken,
    token_type: 'bearer',
    expires_at: Date.now() + 7200 * 1000,
    user: userData,
  };
}

/**
 * Déconnexion de l'utilisateur et révocation du jeton local
 */
export async function logout() {
  if (!USE_MOCKS) {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignorer l'erreur réseau éventuelle lors du logout pour forcer le nettoyage local
    }
  }
  try {
    clearUserReceipt();
  } catch {
    // Ignore
  }
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('polyhack_mode_choisi');
}

/**
 * Récupère le profil de l'utilisateur actuellement connecté depuis l'API FastAPI
 */
export async function fetchCurrentUser() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/auth/me');
    if (data) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(data));
    }
    return data;
  }
  return getStoredUser();
}

/**
 * Récupère le profil utilisateur stocké
 */
export function getStoredUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Récupère le jeton JWT actif
 */
export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Vérifie si la session est active et le jeton non expiré
 */
export function isAuthenticated() {
  const token = getAuthToken();
  if (!token) return false;

  const payload = parseJwt(token);
  if (payload && payload.exp) {
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      logout();
      return false;
    }
  }
  return true;
}
