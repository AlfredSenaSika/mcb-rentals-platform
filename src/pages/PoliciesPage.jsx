import { MCB_CONFIG } from '../lib/config';

const POLICY_SECTIONS = [
  {
    title: '1. Rental Period & Operating Hours',
    body: `A standard rental day covers 24 hours. McB Rentals is open ${MCB_CONFIG.hours} at ${MCB_CONFIG.address}.`,
  },
  {
    title: '2. Late Returns',
    body: 'Equipment returned past the agreed return time incurs a 10% daily late fee per overdue day unless an extension is approved in advance with Front Desk.',
  },
  {
    title: '3. Damaged or Lost Equipment',
    body: 'Clients inspect and sign off on all gear and accessories (with condition photos) at Pickup and Return. The renter is responsible for repair or replacement costs for any damage, missing accessories, or loss occurring during the rental period.',
  },
  {
    title: '4. Refunds & Cancellations',
    body: 'Cancellations made at least 24 hours before pickup qualify for a full credit or refund. Same-day cancellations or unused gear after pickup are non-refundable once gear has been pre-packed or dispatched.',
  },
  {
    title: '5. ID Verification & Security',
    body: 'First-time renters must complete Ghana Card (or passport), live selfie, and two-trustee verification before high-value cinema gear is released.',
  },
];

export function PoliciesPage() {
  return (
    <div className="container" style={{ maxWidth: 880, padding: '40px 20px', display: 'grid', gap: 18 }}>
      <div>
        <span className="badge badge-orange" style={{ marginBottom: 10 }}>
          Official Rental Terms
        </span>
        <h1 style={{ fontSize: 42 }}>Company &amp; Rental Policies</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
          Clear terms for pickups, returns, refunds, late fees, and equipment care.
        </p>
      </div>

      {POLICY_SECTIONS.map((sec) => (
        <div key={sec.title} className="card">
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>{sec.title}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{sec.body}</p>
        </div>
      ))}
    </div>
  );
}
