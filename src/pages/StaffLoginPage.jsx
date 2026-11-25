import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function StaffLoginPage() {
  const navigate = useNavigate();
  const { signInStaff } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInStaff(email, password);
      navigate('/staff');
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460, padding: '56px 20px' }}>
      <div className="card">
        <span className="badge badge-orange" style={{ marginBottom: 12 }}>
          Authorized Staff Only
        </span>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Staff Portal Sign In</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 0, marginBottom: 22 }}>
          Front Desk, Operations, and Admin accounts are protected by role-based access control.
        </p>

        {error && (
          <div
            style={{
              background: 'rgba(248, 81, 73, 0.14)',
              border: '1px solid rgba(248, 81, 73, 0.4)',
              color: '#ff7b72',
              padding: '10px 12px',
              borderRadius: 4,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
            Staff Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@mcbrental.com"
              style={{
                padding: '10px 12px',
                borderRadius: 4,
                border: '1px solid var(--border-strong)',
                background: '#121212',
                color: '#fff',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                padding: '10px 12px',
                borderRadius: 4,
                border: '1px solid var(--border-strong)',
                background: '#121212',
                color: '#fff',
              }}
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Signing In...' : 'Sign In to Staff Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
