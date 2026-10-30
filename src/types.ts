export type GeoPoint = { lat: number; lng: number };

export type Listing = {
  id: string;
  title: string;
  category: string;
  price: number;
  unit: string;
  qty: number;
  breed?: string;
  age?: number;
  weight?: number;
  vaccinated?: boolean;
  sex?: string;
  photos: string[];
  dept: string;
  city: string;
  lat?: number;
  lng?: number;
  seller: string;
  sellerId: string;
  verified: boolean;
  rating: number;
  sales: number;
  emoji: string;
  bg: string;
  date: string;
  views: number;
  desc: string;
  active?: boolean;
};

export type Producer = {
  id: string;
  name: string;
  farmName: string;
  city: string;
  dept: string;
  lat?: number;
  lng?: number;
  verified: boolean;
  rating: number;
  sales: number;
  years: number;
  specialties: string[];
  capacity: string;
  about: string;
  emoji: string;
};

export type Category = { slug: string; icon: string; count: number };

export type CartItem = Listing & { cartQty: number };

export type Role = 'buyer' | 'seller' | 'admin';

export type User = {
  authId?: string;
  name: string;
  email: string;
  phone?: string;
  dept?: string;
  city?: string;
  role: Role;
  farmName?: string;
  years?: number;
  specialties?: string[];
  capacity?: string;
  lat?: number;
  lng?: number;
};

export type DeliveryMode = 'pickup' | 'moto' | 'transport';

export type PayMethod = 'cash_on_delivery' | 'mtn' | 'moov' | 'card' | 'wave';

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export type Order = {
  id?: string;
  buyerId?: string;
  ref: string;
  createdAt: string;
  items: { id: string; title: string; qty: number; price: number; emoji: string; bg: string; sellerId?: string }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  delivery: DeliveryMode;
  payMethod: PayMethod;
  status: OrderStatus;
  paymentStatus?: 'due_on_delivery' | 'paid';
  paymentMethod?: 'cash_on_delivery';
  buyer: { name: string; phone: string; email: string; city: string };
};

export type Message = { id: string; from: 'me' | 'them'; text: string; at: string };

export type Conversation = {
  id: string;
  name: string;
  initial: string;
  color: string;
  online: boolean;
  messages: Message[];
};

export type Payment = {
  ref: string;
  order: string;
  gross: number;
  commission: number;
  net: number;
  date: string;
};
