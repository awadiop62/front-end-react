import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contextes/ContexteAuth';
import { useAppMode } from '../contextes/ContexteModeApp';
import { isAdminRole } from '../types/models';
import RouteProtegee from './RouteProtegee';
import AppShell from '../composants/structure/EnveloppeApp';
import { PageSpinner } from '../composants/ui/Squelette';

// Lazy loading des pages pour optimiser le bundle initial
const Connexion = lazy(() => import('../pages/connexion/Connexion'));
const SelectionIntention = lazy(() => import('../pages/votant/SelectionIntention'));
const HubScrutin = lazy(() => import('../pages/votant/HubScrutin'));
const Galerie = lazy(() => import('../pages/votant/Galerie'));
const DetailProjet = lazy(() => import('../pages/votant/DetailProjet'));
const Recu = lazy(() => import('../pages/votant/Recu'));
const Resultats = lazy(() => import('../pages/votant/Resultats'));
const SoumettreProjet = lazy(() => import('../pages/candidat/SoumettreProjet'));
const Administrateur = lazy(() => import('../pages/administrateur/Administrateur'));
const NonTrouve = lazy(() => import('../pages/erreurs/NonTrouve'));

function ProtectedLayout({ children, requireAdmin = false }) {
  return (
    <RouteProtegee requireAdmin={requireAdmin}>
      <AppShell>
        {children}
      </AppShell>
    </RouteProtegee>
  );
}

export default function RouteurApp() {
  const { isAuthenticated, user } = useAuth();
  const { mode, setMode } = useAppMode();
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    const ROUTE_MODE_MAP = {
      '/hub': 'vote',
      '/vote': 'vote',
      '/galerie': 'vote',
      '/mon-recu': 'vote',
      '/recu': 'vote',
      '/resultats': 'vote',
      '/soumettre': 'candidature',
      '/candidat': 'candidature',
      '/candidature': 'candidature',
      '/proposer-projet': 'candidature',
    };

    let targetMode = ROUTE_MODE_MAP[pathname];
    if (!targetMode && pathname.startsWith('/projets')) targetMode = 'vote';

    if (targetMode && targetMode !== mode) {
      setMode(targetMode);
    }
  }, [location.pathname, mode, setMode]);

  const isAdmin = isAdminRole(user?.role);
  const defaultDashboard = isAdmin ? '/admin' : '/intention';

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* 1. Authentification & Redirection post-connexion */}
      <Route
        path="/connexion"
        element={
          isAuthenticated ? (
            <Navigate to={defaultDashboard} replace />
          ) : (
            <Connexion />
          )
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? defaultDashboard : '/connexion'}
            replace
          />
        }
      />

      {/* 2. SÉLECTION D'ESPACE POST-CONNEXION (VOTE vs SOUMISSION CANDIDATURE) */}
      <Route
        path="/intention"
        element={
          <ProtectedLayout>
            <SelectionIntention />
          </ProtectedLayout>
        }
      />

      {/* 3. PARCOURS ESPACE VOTANT */}
      <Route
        path="/hub"
        element={
          <ProtectedLayout>
            <HubScrutin />
          </ProtectedLayout>
        }
      />

      <Route
        path="/vote"
        element={<Navigate to="/hub" replace />}
      />

      <Route
        path="/galerie"
        element={
          <ProtectedLayout>
            <Galerie />
          </ProtectedLayout>
        }
      />

      <Route
        path="/projets"
        element={<Navigate to="/galerie" replace />}
      />

      <Route
        path="/projets/:id"
        element={
          <ProtectedLayout>
            <DetailProjet />
          </ProtectedLayout>
        }
      />

      <Route
        path="/mon-recu"
        element={
          <ProtectedLayout>
            <Recu />
          </ProtectedLayout>
        }
      />

      <Route
        path="/recu"
        element={<Navigate to="/mon-recu" replace />}
      />

      <Route
        path="/resultats"
        element={
          <ProtectedLayout>
            <Resultats />
          </ProtectedLayout>
        }
      />

      {/* 4. PARCOURS ESPACE CANDIDATURE (EXCLUSIVEMENT SOUMISSION DE PROJET) */}
      <Route
        path="/soumettre"
        element={
          <ProtectedLayout>
            <SoumettreProjet />
          </ProtectedLayout>
        }
      />

      {/* Alias redirigeant vers la soumission unique */}
      <Route
        path="/candidat"
        element={<Navigate to="/soumettre" replace />}
      />

      <Route
        path="/candidature"
        element={<Navigate to="/soumettre" replace />}
      />

      <Route
        path="/proposer-projet"
        element={<Navigate to="/soumettre" replace />}
      />

      {/* 5. ACCÈS ADMINISTRATION COMMISSION IT */}
      <Route
        path="/admin"
        element={
          <ProtectedLayout requireAdmin>
            <Administrateur />
          </ProtectedLayout>
        }
      />

      <Route
        path="/administration"
        element={<Navigate to="/admin" replace />}
      />

      {/* 6. PAGE D'ERREUR 404 */}
      <Route
        path="*"
        element={
          <ProtectedLayout>
            <NonTrouve />
          </ProtectedLayout>
        }
      />
    </Routes>
    </Suspense>
  );
}
