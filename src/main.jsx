import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import GestionnaireErreurs from './composants/ui/GestionnaireErreurs';
import { ThemeProvider } from './contextes/ContexteTheme';
import { AppModeProvider } from './contextes/ContexteModeApp';
import { AuthProvider } from './contextes/ContexteAuth';
import { ToastProvider } from './contextes/ContexteToast';
import { ElectionProvider } from './contextes/ContexteScrutin';
import './styles/global.css';

// Ignorer silencieusement les erreurs de connexion WebSocket HMR désactivé dans l'environnement iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (msg.includes('WebSocket') || msg.includes('ws://') || msg.includes('wss://')) {
      event.preventDefault();
    }
  });
}

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const appTree = (
  <BrowserRouter>
    <ThemeProvider>
      <AppModeProvider>
        <AuthProvider>
          <ToastProvider>
            <ElectionProvider>
              <App />
            </ElectionProvider>
          </ToastProvider>
        </AuthProvider>
      </AppModeProvider>
    </ThemeProvider>
  </BrowserRouter>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GestionnaireErreurs>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {appTree}
        </GoogleOAuthProvider>
      ) : (
        appTree
      )}
    </GestionnaireErreurs>
  </StrictMode>,
);
