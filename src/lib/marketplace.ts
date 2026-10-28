import { supabase } from './supabase';
import type { CartItem, DeliveryMode, Listing, Order } from '../types';

type StoredListing = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  breed: string | null;
  age_days: number | null;
  weight_grams: number | null;
  vaccinated: boolean;
  sex: string | null;
  photos: string[];
  seller_name: string;
  department: string;
  city: string;
  emoji: string;
  background_color: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  active: boolean;
  created_at: string;
};

type StoredOrderItem = {
  listing_id: string;
  seller_id: string;
  title_snapshot: string;
  unit_price: number;
  quantity: number;
  emoji: string;
  background_color: string;
};

type StoredOrder = {
  id: string;
  reference: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  delivery_city: string;
  delivery_mode: Order['delivery'];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: Order['status'];
  payment_status: 'due_on_delivery' | 'paid';
  created_at: string;
  order_items: StoredOrderItem[];
};

function mapListing(row: StoredListing): Listing {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: row.price,
    unit: row.unit,
    qty: row.quantity,
    breed: row.breed ?? undefined,
    age: row.age_days ?? undefined,
    weight: row.weight_grams ?? undefined,
    vaccinated: row.vaccinated,
    sex: row.sex ?? undefined,
    photos: row.photos,
    dept: row.department,
    city: row.city,
    lat: row.latitude ?? undefined,
    lng: row.longitude ?? undefined,
    seller: row.seller_name,
    sellerId: row.seller_id,
    verified: row.verification_status === 'verified',
    rating: 0,
    sales: 0,
    emoji: row.emoji,
    bg: row.background_color,
    date: new Date(row.created_at).toLocaleDateString('fr-FR'),
    views: 0,
    desc: row.description,
    active: row.active,
  };
}

function mapOrder(row: StoredOrder): Order {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    ref: row.reference,
    createdAt: new Date(row.created_at).toLocaleDateString('fr-FR'),
    items: row.order_items.map((item) => ({
      id: item.listing_id,
      sellerId: item.seller_id,
      title: item.title_snapshot,
      qty: item.quantity,
      price: item.unit_price,
      emoji: item.emoji,
      bg: item.background_color,
    })),
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    discount: row.discount,
    total: row.total,
    delivery: row.delivery_mode,
    payMethod: 'cash_on_delivery',
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: 'cash_on_delivery',
    buyer: {
      name: row.buyer_name,
      phone: row.buyer_phone,
      email: row.buyer_email,
      city: row.delivery_city,
    },
  };
}

export async function fetchMarketplaceData(userId: string): Promise<{ listings: Listing[]; orders: Order[] }> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const [listingResult, orderResult] = await Promise.all([
    supabase.from('listings').select('*').or(`active.eq.true,seller_id.eq.${userId}`).order('created_at', { ascending: false }),
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
  ]);
  if (listingResult.error) throw new Error(`Chargement des annonces impossible : ${listingResult.error.message}`);
  if (orderResult.error) throw new Error(`Chargement des commandes impossible : ${orderResult.error.message}`);
  return {
    listings: (listingResult.data as StoredListing[]).map(mapListing),
    orders: (orderResult.data as unknown as StoredOrder[]).map(mapOrder),
  };
}

export async function createRemoteListing(sellerId: string, listing: Listing): Promise<Listing> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { data, error } = await supabase.from('listings').insert({
    seller_id: sellerId,
    title: listing.title.trim(),
    category: listing.category,
    price: listing.price,
    unit: listing.unit,
    quantity: listing.qty,
    breed: listing.breed ?? null,
    age_days: listing.age ?? null,
    weight_grams: listing.weight ?? null,
    vaccinated: listing.vaccinated ?? false,
    sex: listing.sex ?? null,
    photos: listing.photos,
    seller_name: listing.seller,
    department: listing.dept,
    city: listing.city,
    emoji: listing.emoji,
    background_color: listing.bg,
    latitude: listing.lat ?? null,
    longitude: listing.lng ?? null,
    description: listing.desc,
  }).select('*').single();
  if (error) throw new Error(`Publication impossible : ${error.message}`);
  return mapListing(data as StoredListing);
}

export async function deleteRemoteListing(listingId: string, sellerId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { data, error } = await supabase
    .from('listings')
    .update({ active: false, archived: true })
    .eq('id', listingId)
    .eq('seller_id', sellerId)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Suppression impossible : ${error.message}`);
  if (!data) throw new Error('Annonce introuvable ou vous ne pouvez pas l’archiver.');
}

export async function createRemoteOrder(
  order: Order,
  cart: CartItem[],
  delivery: DeliveryMode,
  couponCode: string,
): Promise<Order> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { data, error } = await supabase.rpc('place_order', {
    p_items: cart.map((item) => ({ listing_id: item.id, quantity: item.cartQty })),
    p_delivery_mode: delivery,
    p_buyer_name: order.buyer.name,
    p_buyer_phone: order.buyer.phone,
    p_buyer_email: order.buyer.email,
    p_delivery_city: order.buyer.city,
    p_coupon_code: couponCode,
  });
  if (error) throw new Error(`Commande impossible : ${error.message}`);
  const result = (data as {
    order_id: string;
    order_reference: string;
    order_subtotal: number;
    order_delivery_fee: number;
    order_discount: number;
    order_total: number;
  }[] | null)?.[0];
  if (!result) throw new Error('La base n’a pas retourné la commande créée.');
  return {
    ...order,
    id: result.order_id,
    ref: result.order_reference,
    subtotal: result.order_subtotal,
    deliveryFee: result.order_delivery_fee,
    discount: result.order_discount,
    total: result.order_total,
    status: 'pending',
    paymentStatus: 'due_on_delivery',
    paymentMethod: 'cash_on_delivery',
  };
}

export async function updateRemoteOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const result = status === 'delivered'
    ? await supabase.rpc('seller_complete_cash_order', { p_order_id: orderId })
    : await supabase.rpc('seller_update_order_status', { p_order_id: orderId, p_status: status });
  if (result.error) throw new Error(`Mise à jour de commande impossible : ${result.error.message}`);
}
