import { useEffect, useState } from 'react';
import { MessageSquare, Send, ShoppingBag, X } from 'lucide-react';
import { fetchPublishedCatalog, searchCatalogWithAliases } from '../lib/catalog';
import { useCart } from '../context/CartContext';

export function VisualAiAssistant() {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask me for live rental prices or describe what you need (e.g. "metal stand", "umbrella light", or "Sony FX3").',
      matches: [],
    },
  ]);

  useEffect(() => {
    if (!open || products.length > 0) return;
    fetchPublishedCatalog()
      .then(setProducts)
      .catch(() => {});
  }, [open, products.length]);

  function handleSend(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;

    const matches = searchCatalogWithAliases(products, q);
    const reply =
      matches.length > 0
        ? `Here ${matches.length === 1 ? 'is the closest match' : 'are the closest matches'} with live daily rates:`
        : 'I could not find an exact match in the live catalog. Try another keyword like "C-stand", "Softbox", "R5", or "70-200".';

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q, matches: [] },
      { role: 'assistant', text: reply, matches },
    ]);
    setInput('');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-primary"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 50,
          borderRadius: 999,
          padding: '12px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        }}
      >
        <MessageSquare size={16} />
        Gear &amp; Price Assistant
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'fixed',
            right: 20,
            bottom: 76,
            width: 'min(380px, calc(100vw - 32px))',
            height: 480,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            zIndex: 55,
            overflow: 'hidden',
            boxShadow: '0 14px 36px rgba(0,0,0,0.65)',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong style={{ fontSize: 13 }}>McB Gear &amp; Price Assistant</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'grid', gap: 12, alignContent: 'start' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ display: 'grid', gap: 8 }}>
                <div
                  style={{
                    justifySelf: m.role === 'user' ? 'end' : 'start',
                    background: m.role === 'user' ? 'var(--accent-orange)' : 'var(--bg-elevated)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    maxWidth: '88%',
                  }}
                >
                  {m.text}
                </div>

                {m.matches.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      background: '#121212',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      padding: 8,
                    }}
                  >
                    {item.resolvedImage && (
                      <img
                        src={item.resolvedImage}
                        alt={item.name}
                        style={{
                          width: 52,
                          height: 52,
                          objectFit: 'contain',
                          background: '#fff',
                          borderRadius: 4,
                          padding: 3,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent-orange)', fontWeight: 700 }}>
                        GH₵{Number(item.price_daily || 0).toLocaleString()}/day · {item.availableCount} avail
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '6px 9px', fontSize: 11 }}
                      onClick={() => addItem(item, 1)}
                    >
                      <ShoppingBag size={12} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            style={{
              display: 'flex',
              gap: 8,
              padding: 10,
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask e.g. "metal stand" or "FX3 price"'
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 4,
                border: '1px solid var(--border-strong)',
                background: '#121212',
                color: '#fff',
                fontSize: 12,
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
