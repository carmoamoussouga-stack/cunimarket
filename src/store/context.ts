import { createContext, useContext } from 'react';
import type { CartItem, Listing, Order, User } from '../types';

export type Toast = { msg: string; type: 'success' | 'error' };

export type AppState = {
  listings: Listing[];
  ownListings: Listing[];
  cart: CartItem[];
  favorites: string[];
  user: User | null;
  orders: Order[];
  cartTotal: number;
  cartCount: number;
  toast: Toast | null;
  showToast: (msg: string, type?: Toast['type']) => void;
  addToCart: (listing: Listing, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleFav: (id: string) => void;
  signIn: (user: User) => void;
  signOut: () => void;
  addOrder: (order: Order) => void;
  publishListing: (listing: Listing) => void;
  deleteListing: (id: string) => void;
};

export const AppCtx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
