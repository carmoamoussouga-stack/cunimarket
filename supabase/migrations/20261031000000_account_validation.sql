-- ══ Validation des comptes ═══════════════════════════════════════
-- L'admin valide désormais les COMPTES (acheteurs et producteurs)
-- en plus des annonces. Un compte « pending » ne peut ni publier
-- ni passer commande tant qu'il n'est pas approuvé.

-- 1. Statut de validation du compte.
alter table public.profiles
  add column if not exists verification_status text not null default 'pending';

alter table public.profiles drop constraint profiles_verification_status_check;
alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));

-- Les comptes déjà inscrits avant cette migration sont réputés validés,
-- pour ne pas déconnecter brutalement les utilisateurs existants.
update public.profiles set verification_status = 'verified'
where verification_status = 'pending'
  and created_at < now() - interval '0 seconds';

-- Seuls les comptes créés À PARTIR de maintenant naissent en attente.
-- (Ci-dessus : migration = validés. Nouveaux comptes = trigger 'pending'.)

-- 2. Le rôle admin n'était pas autorisé par la contrainte CHECK de « pilot ».
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('buyer', 'seller', 'admin'));

-- 3. L'admin lit et modifie n'importe quel profil (validation de compte).
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can validate every account" on public.profiles;
create policy "Admins can validate every account"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. L'admin voit toutes les annonces (dont celles en attente).
drop policy if exists "Admins can read every listing" on public.listings;
create policy "Admins can read every listing"
  on public.listings for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins moderate every listing" on public.listings;
create policy "Admins moderate every listing"
  on public.listings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Chaque utilisateur lit son propre statut (pour l'afficher dans Mon compte
--    et pour bloquer publier/commander tant qu'il n'est pas approuvé).
drop policy if exists "Profiles are visible to their owner" on public.profiles;
create policy "Profiles are visible to their owner"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- 6. Promotion en admin : remplacer par l'UUID de votre compte
--    (Authentication → Users dans le dashboard Supabase).
-- update public.profiles
--   set role = 'admin', verification_status = 'verified'
--   where id = 'VOTRE-UUID-Ici';
