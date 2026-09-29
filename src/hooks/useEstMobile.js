import { useState, useEffect } from 'react';

/**
 * Hook retournant true si la largeur de fenêtre est <= 480px.
 * Écoute les changements via matchMedia.
 */
export function useEstMobile(query = '(max-width: 480px)') {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);

    // Initialisation
    setIsMobile(mediaQuery.matches);

    // Écouteur moderne (supporte aussi addListener pour compatibilité)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return isMobile;
}

export default useEstMobile;
