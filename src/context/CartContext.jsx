import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'mcb_cart_v1';

function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [pickupDate, setPickupDate] = useState(() => todayIso(0));
  const [returnDate, setReturnDate] = useState(() => todayIso(1));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage quota errors
    }
  }, [items]);

  const rentalDays = useMemo(() => {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [pickupDate, returnDate]);

  function addItem(product, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price_daily: Number(product.price_daily || 0),
          deposit: Number(product.deposit || 0),
          image: product.resolvedImage || product.featured_image || '',
          quantity: qty,
        },
      ];
    });
  }

  function updateQuantity(productId, nextQty) {
    if (nextQty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity: nextQty } : i))
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const dailySubtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price_daily * i.quantity, 0),
    [items]
  );

  const subtotalGhs = dailySubtotal * rentalDays;

  return (
    <CartContext.Provider
      value={{
        items,
        pickupDate,
        setPickupDate,
        returnDate,
        setReturnDate,
        rentalDays,
        totalCount,
        dailySubtotal,
        subtotalGhs,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
