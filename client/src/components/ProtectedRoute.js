import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getTokenForRole, isTokenValidForRole } from '../utils/auth';

export default function ProtectedRoute({ role, redirectTo }) {
  const location = useLocation();
  const token = getTokenForRole(role);

  if (!token || !isTokenValidForRole(token, role)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
