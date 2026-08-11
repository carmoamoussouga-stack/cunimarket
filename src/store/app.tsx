import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LISTINGS } from '../data/mock';
import { AppCtx } from './context';
import type { AppState, Toast } from './context';
import type { CartItem, Listing, Order, User } from '../types';

const STORAGE_KEY = 'cunimarket:v1';

type Persisted = {
  cart: CartItem[];
  favorites: string[];
  user: User | null;
  orders: Order[];
  ownListings: Listing[];
};

const EMPTY: Persisted = { cart: [], favorites: [], user: null, orders: [], ownListings: [] };

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) };
  } catch {
    return EMPTY;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const showToast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      listings: [...state.ownListings, ...LISTINGS],
      ownListings: state.ownListings,
      cart: state.cart,
      favorites: state.favorites,
      user: state.user,
      orders: state.orders,
      toast,
      showToast,
      cartTotal: state.cart.reduce((s, i) => s + i.price * i.cartQty, 0),
      cartCount: state.cart.reduce((s, i) => s + i.cartQty, 0),
      addToCart: (listing, qty = 1) => {
        setState((prev) => {
          const existing = prev.cart.find((i) => i.id === listing.id);
          const cart = existing
            ? prev.cart.map((i) => (i.id === listing.id ? { ...i, cartQty: i.cartQty + qty } : i))
            : [...prev.cart, { ...listing, cartQty: qty }];
          return { ...prev, cart };
        });
        showToast('Ajouté au panier');
      },
      removeFromCart: (id) => setState((prev) => ({ ...prev, cart: prev.cart.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        setState((prev) => ({
          ...prev,
          cart:
            qty < 1
              ? prev.cart.filter((i) => i.id !== id)
              : prev.cart.map((i) => (i.id === id ? { ...i, cartQty: qty } : i)),
        })),
      clearCart: () => setState((prev) => ({ ...prev, cart: [] })),
      toggleFav: (id) =>
        setState((prev) => ({
          ...prev,
          favorites: prev.favorites.includes(id)
            ? prev.favorites.filter((f) => f !== id)
            : [...prev.favorites, id],
        })),
      signIn: (user) => setState((prev) => ({ ...prev, user })),
      signOut: () => setState((prev) => ({ ...prev, user: null })),
      addOrder: (order) => setState((prev) => ({ ...prev, orders: [order, ...prev.orders], cart: [] })),
      publishListing: (listing) =>
        setState((prev) => ({ ...prev, ownListings: [listing, ...prev.ownListings] })),
      deleteListing: (id) =>
        setState((prev) => ({ ...prev, ownListings: prev.ownListings.filter((l) => l.id !== id) })),
    }),
    [state, toast, showToast],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
