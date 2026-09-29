import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  loginApi,
  loginAdminApi,
  logout as logoutApi,
  getStoredUser,
  isAuthenticated,
  getAuthToken,
  fetchCurrentUser,
  parseJwt,
} from '../api/authService';
import { USE_MOCKS } from '../api/client';
import { useAppMode } from './ContexteModeApp';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getAuthToken());
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const { resetModeChoice } = useAppMode();

  // Synchronisation et validation de la session avec FastAPI au chargement de l'app
  useEffect(() => {
    let cancelled = false;
    if (!USE_MOCKS && token) {
      fetchCurrentUser()
        .then((freshUser) => {
          if (!cancelled && freshUser) {
            setUser(freshUser);
            setAuthed(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            // Si le serveur backend invalide la session (401/403)
            logoutApi();
            setUser(null);
            setToken(null);
            setAuthed(false);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [token]);

  /**
   * Connexion sécurisée électeur via Google SSO ou voter-login
   * Transmet impérativement les identifiants à FastAPI via loginApi
   */
  const login = useCallback(
    async (credentials = {}) => {
      let email = '';
      let idToken = '';

      if (typeof credentials === 'string') {
        email = credentials.trim();
      } else if (credentials && typeof credentials === 'object') {
        email = credentials.email ? String(credentials.email).trim() : '';
        idToken = credentials.idToken ? String(credentials.idToken).trim() : '';
      }

      // Appel obligatoire de l'API backend officielle
      const res = await loginApi({
        email,
        idToken,
      });

      resetModeChoice?.();
      setUser(res.user);
      setToken(res.token);
      setAuthed(true);
      return res.user;
    },
    [resetModeChoice]
  );

  /**
   * Connexion sécurisée administrateur Commission IT avec Passcode
   */
  const loginAdmin = useCallback(async ({ email, passcode }) => {
    const res = await loginAdminApi({ email, passcode });
    setUser(res.user);
    setToken(res.token);
    setAuthed(true);
    return res.user;
  }, []);

  // Après logout, resetModeChoice() doit être appelé pour que la
  // prochaine connexion, même dans le même onglet, réaffiche IntentSelection.
  const logout = useCallback(() => {
    logoutApi();
    resetModeChoice?.();
    try {
      sessionStorage.removeItem('polyhack_mode_choisi');
    } catch {
      // Ignore
    }
    setUser(null);
    setToken(null);
    setAuthed(false);
  }, [resetModeChoice]);

  const tokenPayload = useMemo(() => (token ? parseJwt(token) : null), [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      tokenPayload,
      isAuthenticated: authed,
      login,
      loginAdmin,
      logout,
    }),
    [user, token, tokenPayload, authed, login, loginAdmin, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
