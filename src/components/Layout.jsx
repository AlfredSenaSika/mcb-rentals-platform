import { Link, useLocation } from 'react-router-dom';
import { MCB_CONFIG } from '../lib/config';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }) {
  const location = useLocation();
  const { staffProfile, signOutStaff } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#151515',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 68,
            gap: 16,
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="font-display"
              style={{ fontSize: 28, letterSpacing: '0.06em', color: '#fff' }}
            >
              MC<span style={{ color: 'var(--accent-orange)' }}>B</span> RENTALS
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, fontWeight: 600 }}>
            <Link
              to="/"
              style={{
                color: location.pathname === '/' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              }}
            >
              Storefront
            </Link>
            <Link
              to="/staff"
              style={{
                color: location.pathname.startsWith('/staff')
                  ? 'var(--accent-orange)'
                  : 'var(--text-secondary)',
              }}
            >
              Staff Portal
            </Link>
            {staffProfile ? (
              <button type="button" className="btn btn-secondary" onClick={signOutStaff}>
                Sign Out ({staffProfile.full_name})
              </button>
            ) : (
              <Link to="/staff/login" className="btn btn-primary">
                Staff Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#151515',
          padding: '28px 0',
          marginTop: 48,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <strong style={{ color: '#fff' }}>{MCB_CONFIG.brandName}</strong> ·{' '}
            {MCB_CONFIG.address}
          </div>
          <div>
            {MCB_CONFIG.hours} · WhatsApp +{MCB_CONFIG.whatsappNumber}
          </div>
        </div>
      </footer>
    </div>
  );
}
