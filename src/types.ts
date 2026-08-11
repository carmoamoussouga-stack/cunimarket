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
  dept: string;
  city: string;
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
};

export type Category = { slug: string; icon: string; count: number };

export type CartItem = Listing & { cartQty: number };

export type Role = 'buyer' | 'seller';

export type User = { name: string; email: string; phone?: string; dept?: string; role: Role };

export type DeliveryMode = 'pickup' | 'moto' | 'transport';

export type PayMethod = 'mtn' | 'moov' | 'card' | 'wave';

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered';

export type Order = {
  ref: string;
  createdAt: string;
  items: { id: string; title: string; qty: number; price: number; emoji: string; bg: string }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  delivery: DeliveryMode;
  payMethod: PayMethod;
  status: OrderStatus;
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
