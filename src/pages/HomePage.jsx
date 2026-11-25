import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Search, ShoppingBag, Star, X } from 'lucide-react';
import { fetchPublishedCatalog } from '../lib/catalog';
import { MCB_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();

  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedId, setAddedId] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [catalogData, promoRes, reviewRes] = await Promise.all([
          fetchPublishedCatalog(),
          supabase
            .from('promos_flyers')
            .select('id, title, subtitle, image_url, cta_link')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('customer_reviews')
            .select('id, customer_name, rating, comment, created_at')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(6),
        ]);

        if (!active) return;
        setProducts(catalogData);
        setPromos(promoRes.data || []);
        setReviews(reviewRes.data || []);

        const paramId = searchParams.get('product');
        if (paramId) {
          const match = catalogData.find((p) => p.id === paramId);
          if (match) setSelectedProduct(match);
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load catalog');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [products]);

  const featuredProducts = useMemo(() => {
    const ids = MCB_CONFIG.featuredProductIds.map((f) => f.id);
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (!q) return true;
      return `${p.name} ${p.brand || ''} ${p.model || ''} ${p.category || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [products, category, query]);

  function openProduct(product) {
    setSelectedProduct(product);
    setSearchParams({ product: product.id });
  }

  function closeProduct() {
    setSelectedProduct(null);
    setSearchParams({});
  }

  function handleAdd(product) {
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(''), 1400);
  }

  return (
    <div className="container" style={{ padding: '32px 20px', display: 'grid', gap: 36 }}>
      {/* Hero */}
      <section
        className="card"
        style={{
          padding: '32px 28px',
          background: 'linear-gradient(135deg, #191919 0%, #121212 100%)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <span className="badge badge-orange" style={{ marginBottom: 12 }}>
          {MCB_CONFIG.hours} · Accra, Ghana
        </span>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: 10 }}>
          {MCB_CONFIG.tagline}
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 680, marginTop: 0, marginBottom: 22 }}>
          Cameras, cinema lenses, lighting, audio, grip, and production studios. Check live
          availability, build your gear cart, and confirm your booking with instant itemized
          GHS invoicing.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a href="#catalog" className="btn btn-primary">
            Browse Equipment ({products.length})
          </a>
          <Link to="/signup" className="btn btn-secondary">
            New Client Registration
          </Link>
          <Link to="/policies" className="btn btn-secondary">
            Rental Policies
          </Link>
        </div>
      </section>

      {/* Promos & Flyers */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 style={{ fontSize: 30 }}>Promotions &amp; Active Deals</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Updated by McB Admin
          </span>
        </div>

        {promos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {promos.map((promo) => (
              <div key={promo.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {promo.image_url && (
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                  />
                )}
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 22, marginBottom: 4 }}>{promo.title}</h3>
                  {promo.subtitle && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                      {promo.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              borderColor: 'rgba(225, 101, 39, 0.4)',
            }}
          >
            <div>
              <span className="badge badge-orange" style={{ marginBottom: 8 }}>
                Weekend &amp; Multi-Day Shooters
              </span>
              <h3 style={{ fontSize: 24, marginBottom: 4 }}>
                Book Thu–Sun Packages Early &amp; Pre-Pack Ahead of Time
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                Reserve your full camera, lens, and lighting kit online before Thursday packing.
              </p>
            </div>
            <Link to="/cart" className="btn btn-primary">
              Build Your Kit
            </Link>
          </div>
        )}
      </section>

      {/* Featured Gear (Fixed Product IDs) */}
      {featuredProducts.length > 0 && (
        <section>
          <h2 style={{ fontSize: 30, marginBottom: 14 }}>Featured Cinema Gear</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                added={addedId === p.id}
                onOpen={() => openProduct(p)}
                onAdd={() => handleAdd(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full Live Catalog */}
      <section id="catalog">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 32 }}>Live Equipment Catalog</h2>

          <div style={{ position: 'relative', minWidth: 260, flex: '1 1 280px', maxWidth: 380 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Sony FX3, R5, 70-200mm, C-stand..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: 4,
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                color: '#fff',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={category === cat ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '7px 14px', fontSize: 12 }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card" style={{ color: 'var(--text-secondary)' }}>
            Loading live McB catalog...
          </div>
        ) : error ? (
          <div className="card" style={{ color: '#ff7b72' }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ color: 'var(--text-secondary)' }}>
            No equipment matched &ldquo;{query}&rdquo;. Try asking the Gear Assistant in the bottom corner.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                added={addedId === p.id}
                onOpen={() => openProduct(p)}
                onAdd={() => handleAdd(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Customer Reviews */}
      <section>
        <h2 style={{ fontSize: 30, marginBottom: 14 }}>Verified Client Reviews</h2>
        {reviews.length === 0 ? (
          <div className="card" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Client star ratings appear here after completed gear returns.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {reviews.map((rev) => (
              <div key={rev.id} className="card">
                <div style={{ display: 'flex', gap: 4, color: 'var(--accent-orange)', marginBottom: 8 }}>
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} size={14} fill="currentColor" />
                  ))}
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {rev.comment || 'Smooth pickup and return.'}
                </p>
                <strong style={{ fontSize: 12 }}>{rev.customer_name}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 60,
          }}
          onClick={closeProduct}
        >
          <div
            className="card"
            style={{ maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeProduct}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                color: '#fff',
                borderRadius: 4,
                padding: 6,
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'grid', gap: 18 }}>
              {selectedProduct.resolvedImage && (
                <img
                  src={selectedProduct.resolvedImage}
                  alt={selectedProduct.name}
                  style={{
                    width: '100%',
                    maxHeight: 260,
                    objectFit: 'contain',
                    background: '#fff',
                    borderRadius: 6,
                    padding: 12,
                  }}
                />
              )}

              <div>
                <span className="badge badge-orange" style={{ marginBottom: 8 }}>
                  {selectedProduct.category}
                </span>
                <h2 style={{ fontSize: 32, marginBottom: 6 }}>{selectedProduct.name}</h2>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ fontSize: 20, color: 'var(--accent-orange)' }}>
                    GH₵{Number(selectedProduct.price_daily || 0).toLocaleString()} / day
                  </strong>
                  <span className={selectedProduct.availableCount > 0 ? 'badge badge-ok' : 'badge badge-warn'}>
                    {selectedProduct.availableCount > 0
                      ? `${selectedProduct.availableCount} Available`
                      : 'Currently Out / Unavailable'}
                  </span>
                </div>
                {selectedProduct.short_desc && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0 }}>
                    {selectedProduct.short_desc}
                  </p>
                )}
              </div>

              {Array.isArray(selectedProduct.accessories) && selectedProduct.accessories.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 18, marginBottom: 6 }}>Included Accessories</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedProduct.accessories.map((acc, i) => (
                      <span key={i} className="badge badge-ok">
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleAdd(selectedProduct)}
                >
                  <ShoppingBag size={16} />
                  {addedId === selectedProduct.id ? 'Added to Cart' : 'Add to Cart'}
                </button>
                <Link to="/cart" className="btn btn-secondary">
                  View Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, added, onOpen, onAdd }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 12,
        padding: 14,
      }}
    >
      <div>
        <div
          onClick={onOpen}
          style={{
            height: 165,
            background: '#ffffff',
            borderRadius: 6,
            display: 'grid',
            placeItems: 'center',
            padding: 10,
            marginBottom: 12,
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          {product.resolvedImage ? (
            <img
              src={product.resolvedImage}
              alt={product.name}
              loading="lazy"
              style={{ maxWidth: '100%', maxHeight: 145, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ color: '#666', fontSize: 12 }}>No Image</span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {product.category}
          </span>
          <span className={product.availableCount > 0 ? 'badge badge-ok' : 'badge badge-warn'}>
            {product.availableCount > 0 ? `${product.availableCount} Avail` : 'Out'}
          </span>
        </div>

        <h3
          onClick={onOpen}
          style={{ fontSize: 20, marginBottom: 6, cursor: 'pointer' }}
        >
          {product.name}
        </h3>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <strong style={{ color: 'var(--accent-orange)', fontSize: 15 }}>
          GH₵{Number(product.price_daily || 0).toLocaleString()}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>/day</span>
        </strong>
        <button type="button" className="btn btn-primary" style={{ padding: '7px 12px' }} onClick={onAdd}>
          {added ? <Check size={14} /> : <ShoppingBag size={14} />}
          {added ? 'Added' : 'Add'}
        </button>
      </div>
    </div>
  );
}
