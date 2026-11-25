import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles, children }) {
  const { session, staffProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ padding: '64px 20px', color: 'var(--text-secondary)' }}>
        Verifying staff session...
      </div>
    );
  }

  if (!session || !staffProfile) {
    return <Navigate to="/staff/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(staffProfile.role)) {
    return (
      <div className="container" style={{ padding: '64px 20px' }}>
        <div className="card">
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Your role ({staffProfile.role}) does not have permission to view this section.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
