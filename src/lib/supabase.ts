import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Role, User } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function appUserFromSupabase(user: SupabaseUser): User {
  const metadata = user.user_metadata;
  const role: Role = metadata.role === 'seller' ? 'seller' : metadata.role === 'admin' ? 'admin' : 'buyer';

  return {
    authId: user.id,
    name: typeof metadata.name === 'string' ? metadata.name : user.email?.split('@')[0] ?? 'Utilisateur',
    email: user.email ?? '',
    phone: typeof metadata.phone === 'string' ? metadata.phone : '',
    dept: typeof metadata.dept === 'string' ? metadata.dept : '',
    city: typeof metadata.city === 'string' ? metadata.city : '',
    role,
    farmName: typeof metadata.farmName === 'string' ? metadata.farmName : undefined,
    years: typeof metadata.years === 'number' ? metadata.years : undefined,
    capacity: typeof metadata.capacity === 'string' ? metadata.capacity : undefined,
    specialties: Array.isArray(metadata.specialties)
      ? metadata.specialties.filter((item): item is string => typeof item === 'string')
      : undefined,
    lat: typeof metadata.lat === 'number' ? metadata.lat : undefined,
    lng: typeof metadata.lng === 'number' ? metadata.lng : undefined,
  };
}
