import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { MCB_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';

export function CartCheckoutPage() {
  const {
    items,
    pickupDate,
    setPickupDate,
    returnDate,
    setReturnDate,
    rentalDays,
    subtotalGhs,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [paymentMode, setPaymentMode] = useState('momo');
  const [notes, setNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedInvoice, setConfirmedInvoice] = useState(null);

  function handleReview(e) {
    e.preventDefault();
    setError('');
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (returnDate < pickupDate) {
      setError('Return date cannot be earlier than pickup date.');
      return;
    }
    setReviewing(true);
  }

  async function handleConfirmBooking() {
    setSubmitting(true);
    setError('');
    const orderCode = `MCB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const payload = {
        order_code: orderCode,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim() || null,
        pickup_date: pickupDate,
        return_date: returnDate,
        payment_mode: paymentMode,
        subtotal_ghs: subtotalGhs,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity,
          daily_rate_ghs: i.price_daily,
          line_total_ghs: i.price_daily * i.quantity * rentalDays,
        })),
      };

      const { error: insertErr } = await supabase.from('studio_requests').insert([
        {
          client_name: payload.client_name,
          client_phone: payload.client_phone,
          pickup_date: payload.pickup_date,
          return_date: payload.return_date,
          status: 'pending_payment',
          payload,
        },
      ]);

      if (insertErr) throw insertErr;

      setConfirmedInvoice(payload);
      clearCart();
      setReviewing(false);
    } catch (err) {
      setError(err.message || 'Could not submit booking. Please verify details and retry.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedInvoice) {
    return (
      <div className="container" style={{ maxWidth: 780, padding: '40px 20px' }}>
        <div className="card" style={{ background: '#ffffff', color: '#121212', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #121212', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 38, color: '#121212' }}>MCB RENTALS INVOICE</h1>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>
                {MCB_CONFIG.address} · +{MCB_CONFIG.whatsappNumber}
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <div><strong>Invoice #:</strong> {confirmedInvoice.order_code}</div>
              <div><strong>Pickup:</strong> {confirmedInvoice.pickup_date}</div>
              <div><strong>Return:</strong> {confirmedInvoice.return_date}</div>
            </div>
          </div>

          <div style={{ marginBottom: 20, fontSize: 13 }}>
            <div><strong>Client:</strong> {confirmedInvoice.client_name}</div>
            <div><strong>Phone:</strong> {confirmedInvoice.client_phone}</div>
            <div>
              <strong>Payment Mode:</strong>{' '}
              {MCB_CONFIG.paymentModes.find((m) => m.id === confirmedInvoice.payment_mode)?.label}
            </div>
          </div>

          <div className="table-wrap" style={{ borderColor: '#ddd', marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ background: '#f4f4f4', color: '#121212' }}>Equipment</th>
                  <th style={{ background: '#f4f4f4', color: '#121212' }}>Qty</th>
                  <th style={{ background: '#f4f4f4', color: '#121212' }}>Rate/Day</th>
                  <th style={{ background: '#f4f4f4', color: '#121212' }}>Total ({rentalDays}d)</th>
                </tr>
              </thead>
              <tbody>
                {confirmedInvoice.items.map((item) => (
                  <tr key={item.product_id}>
                    <td style={{ borderColor: '#eee' }}>{item.product_name}</td>
                    <td style={{ borderColor: '#eee' }}>{item.quantity}</td>
                    <td style={{ borderColor: '#eee' }}>GH₵{item.daily_rate_ghs.toLocaleString()}</td>
                    <td style={{ borderColor: '#eee' }}>
                      <strong>GH₵{item.line_total_ghs.toLocaleString()}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
            <span>Total Due ({MCB_CONFIG.currency})</span>
            <span style={{ color: '#e16527', fontSize: 24 }}>
              GH₵{confirmedInvoice.subtotal_ghs.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={15} />
              Print / Save PDF Invoice
            </button>
            <Link to="/" className="btn btn-secondary">
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 20px', display: 'grid', gap: 24 }}>
      <h1 style={{ fontSize: 40 }}>Your Equipment Cart</h1>

      {items.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
            Your cart is currently empty. Add cameras, lenses, lighting, or audio gear to begin.
          </p>
          <Link to="/" className="btn btn-primary">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 20 }}>
          {/* Cart Items */}
          <div className="card">
            <h2 style={{ fontSize: 26, marginBottom: 14 }}>Selected Gear ({rentalDays} day{rentalDays > 1 ? 's' : ''})</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{item.name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      GH₵{item.price_daily.toLocaleString()} / day
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                      style={{
                        width: 58,
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--border-strong)',
                        background: '#121212',
                        color: '#fff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      className="btn btn-secondary"
                      style={{ padding: '7px 9px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 18, fontWeight: 700 }}>
              <span>Estimated Total</span>
              <span style={{ color: 'var(--accent-orange)' }}>GH₵{subtotalGhs.toLocaleString()}</span>
            </div>
          </div>

          {/* Checkout & Mandatory Confirm */}
          <div className="card">
            <h2 style={{ fontSize: 26, marginBottom: 14 }}>
              {reviewing ? 'Review & Confirm Booking' : 'Booking & Payment Details'}
            </h2>

            {error && (
              <div style={{ color: '#ff7b72', fontSize: 13, marginBottom: 12 }}>{error}</div>
            )}

            {!reviewing ? (
              <form onSubmit={handleReview} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 }}>
                    Pickup Date
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 }}>
                    Return Date
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                </div>

                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 }}>
                  Full Name
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 }}>
                  Phone / WhatsApp Number
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="024 XXX XXXX"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 }}>
                  Email (Optional — for instant receipt copy)
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 }}>
                  Payment Mode
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    style={inputStyle}
                  >
                    {MCB_CONFIG.paymentModes.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 600 }}>
                  Shoot / Pickup Notes (Optional)
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special lens mount or pickup time note"
                    style={inputStyle}
                  />
                </label>

                <button type="submit" className="btn btn-primary">
                  Review Booking Before Confirming
                </button>
              </form>
            ) : (
              <div style={{ display: 'grid', gap: 14, fontSize: 13 }}>
                <div style={{ background: '#121212', padding: 14, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                  <div><strong>Client:</strong> {clientName} ({clientPhone})</div>
                  <div><strong>Dates:</strong> {pickupDate} → {returnDate} ({rentalDays} day{rentalDays > 1 ? 's' : ''})</div>
                  <div><strong>Payment:</strong> {MCB_CONFIG.paymentModes.find((m) => m.id === paymentMode)?.label}</div>
                  <div><strong>Total:</strong> GH₵{subtotalGhs.toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setReviewing(false)}
                    disabled={submitting}
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleConfirmBooking}
                    disabled={submitting}
                  >
                    {submitting ? 'Confirming...' : 'Confirm & Generate Invoice'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 4,
  border: '1px solid var(--border-strong)',
  background: '#121212',
  color: '#fff',
  fontSize: 13,
};
