import { createContext, useCallback, useContext, useState } from 'react';
import ConteneurNotification from '../composants/ui/ConteneurNotification';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const id = ++idCounter;
    const toast = { id, message, variant: options.variant || 'success', action: options.action };
    setToasts((list) => [...list, toast]);
    const duration = options.duration ?? 4000;
    if (duration) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <ConteneurNotification toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx;
}
