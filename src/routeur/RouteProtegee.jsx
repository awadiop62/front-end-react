import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contextes/ContexteAuth';
import { isAdminRole } from '../types/models';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdminRole(user?.role)) {
    return <Navigate to="/hub" replace />;
  }

  return children;
}
