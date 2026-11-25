import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function StaffPortalPlaceholder() {
  const { staffProfile, activeOperator, verifyEmployeePin } = useAuth();
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  async function handlePinSubmit(e) {
    e.preventDefault();
    setPinMsg('');
    try {
      const match = await verifyEmployeePin(pin);
      setPinMsg(`Active Operator: ${match.full_name} (${match.role})`);
      setPin('');
    } catch (err) {
      setPinMsg(err.message || 'Invalid Employee Code');
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px', display: 'grid', gap: 20 }}>
      <div className="card">
        <span className="badge badge-ok" style={{ marginBottom: 10 }}>
          Authenticated Staff Session
        </span>
        <h1 style={{ fontSize: 38, marginBottom: 6 }}>
          Welcome, {staffProfile.full_name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Role: <strong style={{ color: '#fff' }}>{staffProfile.role}</strong>
          {activeOperator ? ` · Active PIN Operator: ${activeOperator.full_name}` : ''}
        </p>
      </div>

      <div className="card" style={{ maxWidth: 460 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Operations Employee Code PIN Pad</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 0 }}>
          Verify a 4-digit Employee Code on shared floor devices without logging out.
        </p>
        <form onSubmit={handlePinSubmit} style={{ display: 'flex', gap: 10 }}>
          <input
            type="password"
            maxLength={8}
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="4-digit PIN"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 4,
              border: '1px solid var(--border-strong)',
              background: '#121212',
              color: '#fff',
            }}
          />
          <button type="submit" className="btn btn-primary">
            Verify PIN
          </button>
        </form>
        {pinMsg && (
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: 'var(--accent-orange)' }}>
            {pinMsg}
          </p>
        )}
      </div>
    </div>
  );
}
