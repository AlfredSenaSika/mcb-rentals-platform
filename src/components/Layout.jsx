import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { MCB_CONFIG } from '../lib/config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Layout({ children }) {
  const location = useLocation();
  const { staffProfile, signOutStaff } = useAuth();
  const { totalCount } = useCart();

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
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 68,
            paddingTop: 8,
            paddingBottom: 8,
            gap: 14,
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

          <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: 13, fontWeight: 600 }}>
            <Link
              to="/"
              style={{
                color: location.pathname === '/' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              }}
            >
              Storefront
            </Link>
            <Link
              to="/policies"
              style={{
                color: location.pathname === '/policies' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              }}
            >
              Policies
            </Link>
            <Link
              to="/signup"
              style={{
                color: location.pathname === '/signup' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              }}
            >
              Sign Up
            </Link>
            <Link
              to="/cart"
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: 12 }}
            >
              <ShoppingBag size={14} />
              Cart ({totalCount})
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Link to="/policies" style={{ color: 'var(--accent-orange)' }}>
              Rental Policies
            </Link>
            <span>{MCB_CONFIG.hours}</span>
            <span>WhatsApp +{MCB_CONFIG.whatsappNumber}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
