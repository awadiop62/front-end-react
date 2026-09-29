import React from 'react';
import Bouton from './Bouton';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Enregistrement de l'erreur pour la session de débogage
    console.error('Erreur interceptée par ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-lg)',
            background: 'var(--bg-canvas)',
            color: 'var(--ink)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-xl)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-md)',
              }}
            >
              <span className="msr msr-32">error_outline</span>
            </div>

            <h1 className="text-h2" style={{ margin: '0 0 8px 0' }}>
              Une erreur inattendue est survenue
            </h1>
            <p className="text-body" style={{ color: 'var(--ink-muted)', margin: '0 0 var(--space-lg) 0' }}>
              L'application a rencontré un problème d'affichage. Vos données de session et votre progression restent protégées.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Bouton tone="accent" onClick={() => window.location.reload()}>
                <span className="msr msr-16">refresh</span>
                Recharger la page
              </Bouton>
              <Bouton tone="neutral" onClick={this.handleReset}>
                <span className="msr msr-16">home</span>
                Retourner à l'accueil
              </Bouton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
