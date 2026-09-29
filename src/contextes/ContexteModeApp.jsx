import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AppModeContext = createContext(null);
const MODE_KEY = 'polyhack_app_mode';
const CHOISI_KEY = 'polyhack_mode_choisi';

export function AppModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(MODE_KEY);
      if (saved === 'candidature' || saved === 'vote') {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'vote';
  });

  const [modeChoisi, setModeChoisi] = useState(() => {
    try {
      return sessionStorage.getItem(CHOISI_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const setMode = useCallback((newMode) => {
    if (newMode === 'vote' || newMode === 'candidature') {
      setModeState(newMode);
      setModeChoisi(true);
      try {
        sessionStorage.setItem(MODE_KEY, newMode);
        sessionStorage.setItem(CHOISI_KEY, 'true');
      } catch {
        // Ignore
      }
    }
  }, []);

  const resetModeChoice = useCallback(() => {
    setModeChoisi(false);
    try {
      sessionStorage.removeItem(CHOISI_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const value = useMemo(
    () => ({ mode, modeChoisi, setMode, resetModeChoice }),
    [mode, modeChoisi, setMode, resetModeChoice]
  );

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) {
    throw new Error('useAppMode doit être utilisé dans AppModeProvider');
  }
  return ctx;
}
