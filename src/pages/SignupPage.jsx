import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ghanaCard, setGhanaCard] = useState('');
  const [trusteeOne, setTrusteeOne] = useState('');
  const [trusteeTwo, setTrusteeTwo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { error: rpcError } = await supabase.rpc('register_client', {
        p_full_name: fullName.trim(),
        p_phone: phone.trim(),
        p_email: email.trim(),
        p_id_number: ghanaCard.trim(),
        p_trustee_1: trusteeOne.trim(),
        p_trustee_2: trusteeTwo.trim(),
      });
      if (rpcError) throw rpcError;
      setSubmitted(true);
    } catch (err) {
      setError(
        err.message ||
          'Registration could not be completed automatically. Please contact Front Desk on WhatsApp.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640, padding: '40px 20px', display: 'grid', gap: 20 }}>
      {/* KYC Explanation Banner (Fixes high-friction confusion) */}
      <div
        className="card"
        style={{
          borderColor: 'rgba(225, 101, 39, 0.45)',
          background: 'rgba(225, 101, 39, 0.08)',
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <ShieldCheck size={22} style={{ color: 'var(--accent-orange)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13 }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>
            Why We Verify Ghana Card &amp; 2 Trustees
          </strong>
          <span style={{ color: 'var(--text-secondary)' }}>
            Verification protects high-value cinema equipment and lets approved clients rent without
            paying full replacement deposits. Most verifications are reviewed within 15–30 minutes
            during operating hours (7:00am – 9:00pm).
          </span>
        </div>
      </div>

      <div className="card">
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>Client Registration</h1>

        {submitted ? (
          <div style={{ color: '#56d364', fontSize: 14 }}>
            Registration submitted! Front Desk will verify your details shortly so you can pick up
            gear faster.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            {error && <div style={{ color: '#ff7b72', fontSize: 13 }}>{error}</div>}
            <label style={labelStyle}>
              Full Name
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Phone / WhatsApp Number
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Email Address
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Ghana Card / Passport Number
              <input type="text" required value={ghanaCard} onChange={(e) => setGhanaCard(e.target.value)} placeholder="GHA-XXXXXXXXX-X" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Trustee 1 (Name &amp; Phone)
              <input type="text" required value={trusteeOne} onChange={(e) => setTrusteeOne(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Trustee 2 (Name &amp; Phone)
              <input type="text" required value={trusteeTwo} onChange={(e) => setTrusteeTwo(e.target.value)} style={inputStyle} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 };
const inputStyle = {
  padding: '10px 12px',
  borderRadius: 4,
  border: '1px solid var(--border-strong)',
  background: '#121212',
  color: '#fff',
  fontSize: 13,
};
