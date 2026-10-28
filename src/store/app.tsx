import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LISTINGS } from '../data/mock';
import { AppCtx } from './context';
import type { AppState, Toast } from './context';
import type { CartItem, GeoPoint, Listing, Order, User } from '../types';
import { appUserFromSupabase, supabase } from '../lib/supabase';
import {
  createRemoteListing,
  createRemoteOrder,
  deleteRemoteListing,
  fetchMarketplaceData,
  updateRemoteOrderStatus,
} from '../lib/marketplace';

const STORAGE_KEY = 'cunimarket:v2';

type Persisted = {
  cart: CartItem[];
  favorites: string[];
  user: User | null;
  orders: Order[];
  ownListings: Listing[];
  stock: Record<string, number>;
  coords: GeoPoint | null;
  locationAsked: boolean;
};

const EMPTY: Persisted = {
  cart: [],
  favorites: [],
  user: null,
  orders: [],
  ownListings: [],
  stock: {},
  coords: null,
  locationAsked: false,
};

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
  const [remoteListings, setRemoteListings] = useState<Listing[]>([]);
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshRemoteData = useCallback(async (userId: string) => {
    try {
      const data = await fetchMarketplaceData(userId);
      setRemoteListings(data.listings);
      setRemoteOrders(data.orders);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement Supabase';
      console.error('Supabase marketplace load failed:', error);
      showToast(message, 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        showToast('Impossible de vérifier la session Supabase', 'error');
        console.error('Supabase session check failed:', error.message);
        return;
      }
      if (active && data.session) {
        const user = appUserFromSupabase(data.session.user);
        setState((prev) => ({
          ...prev,
          user,
          coords: user.lat != null && user.lng != null ? { lat: user.lat, lng: user.lng } : prev.coords,
        }));
        if (user.authId) void refreshRemoteData(user.authId);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        const user = appUserFromSupabase(session.user);
        setState((prev) => ({
          ...prev,
          user,
          coords: user.lat != null && user.lng != null ? { lat: user.lat, lng: user.lng } : prev.coords,
        }));
        const userId = user.authId;
        if (userId) window.setTimeout(() => void refreshRemoteData(userId), 0);
      } else {
        setState((prev) => ({ ...prev, user: null }));
        setRemoteListings([]);
        setRemoteOrders([]);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refreshRemoteData, showToast]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<AppState>(
    () => ({
      listings: supabase
        ? remoteListings.filter((listing) => listing.active)
        : [...state.ownListings, ...LISTINGS].map((listing) => ({
            ...listing,
            qty: state.stock[listing.id] ?? listing.qty,
          })),
      ownListings: supabase
        ? remoteListings.filter((listing) => listing.sellerId === state.user?.authId)
        : state.ownListings,
      cart: state.cart,
      favorites: state.favorites,
      user: state.user,
      orders: supabase ? remoteOrders : state.orders,
      coords: state.coords,
      locationAsked: state.locationAsked,
      toast,
      showToast,
      cartTotal: state.cart.reduce((s, i) => s + i.price * i.cartQty, 0),
      cartCount: state.cart.reduce((s, i) => s + i.cartQty, 0),
      addToCart: (listing, qty = 1) => {
        const existing = state.cart.find((item) => item.id === listing.id);
        const remaining = listing.qty - (existing?.cartQty ?? 0);
        const requested = Math.max(1, Math.floor(qty));
        if (remaining <= 0) {
          showToast('La quantité disponible est déjà dans votre panier.', 'error');
          return;
        }
        const accepted = Math.min(requested, remaining);
        setState((prev) => {
          const current = prev.cart.find((i) => i.id === listing.id);
          if (current) {
            const cart = prev.cart.map((item) => item.id === listing.id
              ? { ...item, cartQty: Math.min(item.qty, item.cartQty + accepted) }
              : item,
            );
            return { ...prev, cart };
          }
          return { ...prev, cart: [...prev.cart, { ...listing, cartQty: accepted }] };
        });
        showToast(accepted < requested ? 'Quantité limitée au stock disponible.' : 'Ajouté au panier');
      },
      removeFromCart: (id) => setState((prev) => ({ ...prev, cart: prev.cart.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        setState((prev) => ({
          ...prev,
          cart:
            qty < 1
              ? prev.cart.filter((i) => i.id !== id)
              : prev.cart.map((i) => (i.id === id ? { ...i, cartQty: Math.min(i.qty, qty) } : i)),
        })),
      clearCart: () => setState((prev) => ({ ...prev, cart: [] })),
      toggleFav: (id) =>
        setState((prev) => ({
          ...prev,
          favorites: prev.favorites.includes(id)
            ? prev.favorites.filter((f) => f !== id)
            : [...prev.favorites, id],
        })),
      signIn: (user) =>
        setState((prev) => ({
          ...prev,
          user,
          coords: user.lat != null && user.lng != null ? { lat: user.lat, lng: user.lng } : prev.coords,
        })),
      signOut: () => {
        setState((prev) => ({ ...prev, user: null }));
        if (supabase) {
          void supabase.auth.signOut().then(({ error }) => {
            if (error) {
              console.error('Supabase sign-out failed:', error.message);
              showToast('Impossible de fermer la session distante', 'error');
            }
          });
        }
      },
      updateUser: (patch) =>
        setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, ...patch } } : prev)),
      setCoords: (coords) =>
        setState((prev) => ({
          ...prev,
          coords,
          locationAsked: true,
          user:
            prev.user && coords
              ? { ...prev.user, lat: coords.lat, lng: coords.lng }
              : prev.user,
        })),
      setLocationAsked: (asked) => setState((prev) => ({ ...prev, locationAsked: asked })),
      addOrder: async (order) => {
        if (supabase) {
          if (!state.user?.authId) throw new Error('Reconnectez-vous avant de confirmer la commande.');
          if (state.cart.some((item) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id))) {
            throw new Error('Votre panier contient une annonce de démonstration. Videz-le puis ajoutez une annonce du catalogue Supabase.');
          }
          const created = await createRemoteOrder(
            order,
            state.cart,
            order.delivery,
            order.discount > 0 ? 'CUNIMARKET10' : '',
          );
          setRemoteOrders((previous) => [created, ...previous]);
          setState((previous) => ({ ...previous, cart: [] }));
          return created;
        }
        const listings = [...state.ownListings, ...LISTINGS];
        const currentStock = state.cart.map((item) => {
          const listing = listings.find((candidate) => candidate.id === item.id);
          const available = listing ? state.stock[item.id] ?? listing.qty : 0;
          if (!listing || item.cartQty > available) {
            throw new Error(`Le stock de « ${item.title} » a changé. Vérifiez votre panier.`);
          }
          return [item.id, available - item.cartQty] as const;
        });
        setState((previous) => ({
          ...previous,
          orders: [order, ...previous.orders],
          cart: [],
          stock: { ...previous.stock, ...Object.fromEntries(currentStock) },
        }));
        return order;
      },
      updateOrderStatus: async (ref, status) => {
        if (supabase) {
          const order = remoteOrders.find((item) => item.ref === ref);
          if (!order?.id) throw new Error('Commande introuvable ou non synchronisée.');
          await updateRemoteOrderStatus(order.id, status);
          if (state.user?.authId) await refreshRemoteData(state.user.authId);
          return;
        }
        setState((previous) => ({
          ...previous,
          orders: previous.orders.map((order) =>
            order.ref === ref
              ? { ...order, status, paymentStatus: status === 'delivered' ? 'paid' : order.paymentStatus }
              : order,
          ),
        }));
      },
      publishListing: async (listing) => {
        if (supabase) {
          if (state.user?.role !== 'seller' || !state.user.authId) {
            throw new Error('Connectez-vous avec un compte producteur pour publier.');
          }
          const created = await createRemoteListing(state.user.authId, listing);
          setRemoteListings((previous) => [created, ...previous]);
          return;
        }
        setState((previous) => ({ ...previous, ownListings: [listing, ...previous.ownListings] }));
      },
      deleteListing: async (id) => {
        if (supabase) {
          if (!state.user?.authId) throw new Error('Reconnectez-vous pour supprimer cette annonce.');
          await deleteRemoteListing(id, state.user.authId);
          setRemoteListings((previous) => previous.map((listing) =>
            listing.id === id ? { ...listing, active: false } : listing,
          ));
          return;
        }
        setState((previous) => ({ ...previous, ownListings: previous.ownListings.filter((listing) => listing.id !== id) }));
      },
    }),
    [state, toast, showToast, remoteListings, remoteOrders, refreshRemoteData],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
