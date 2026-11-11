import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Role, User } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export async function appUserFromSupabase(user: SupabaseUser): Promise<User> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const metadata = user.user_metadata;
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, verification_status, account_status')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw new Error(`Chargement du profil impossible : ${error.message}`);
  const metadataRole: Role = metadata.role === 'seller' ? 'seller' : metadata.role === 'admin' ? 'admin' : 'buyer';
  const role: Role = profile?.role === 'seller' || profile?.role === 'admin'
    ? profile.role
    : profile?.role === 'buyer'
      ? 'buyer'
      : metadataRole;

  return {
    authId: user.id,
    name: typeof metadata.name === 'string' ? metadata.name : user.email?.split('@')[0] ?? 'Utilisateur',
    email: user.email ?? '',
    phone: typeof metadata.phone === 'string' ? metadata.phone : '',
    dept: typeof metadata.dept === 'string' ? metadata.dept : '',
    city: typeof metadata.city === 'string' ? metadata.city : '',
    role,
    verificationStatus: profile?.verification_status === 'verified' || profile?.verification_status === 'rejected'
      ? profile.verification_status
      : 'pending',
    accountStatus: profile?.account_status === 'suspended' ? 'suspended' : 'active',
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
