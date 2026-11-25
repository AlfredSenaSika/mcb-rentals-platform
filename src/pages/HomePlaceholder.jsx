import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MCB_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';

export function HomePlaceholder() {
  const [catalogCount, setCatalogCount] = useState(null);

  useEffect(() => {
    supabase
      .from('inv_products')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (typeof count === 'number') setCatalogCount(count);
      });
  }, []);

  return (
    <div className="container" style={{ padding: '48px 20px' }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <span className="badge badge-orange" style={{ marginBottom: 12 }}>
          Phase 1 Foundation Active
        </span>
        <h1 style={{ fontSize: 48, marginBottom: 10 }}>
          {MCB_CONFIG.brandName} — {MCB_CONFIG.tagline}
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 720, marginTop: 0 }}>
          Connected to live Supabase catalog
          {catalogCount !== null ? ` (${catalogCount} items detected)` : ''}. Operating hours:{' '}
          <strong style={{ color: '#fff' }}>{MCB_CONFIG.hours}</strong>.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          <Link to="/staff" className="btn btn-primary">
            Open Staff Portal
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 26, marginBottom: 12 }}>Remapped Featured Gear IDs</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Verified Supabase ID</th>
              </tr>
            </thead>
            <tbody>
              {MCB_CONFIG.featuredProductIds.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>
                    <code>{item.id}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
