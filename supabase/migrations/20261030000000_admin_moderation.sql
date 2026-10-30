-- ══ Modération admin : rôle + politiques RLS ════════════════════
-- La migration « pilot » n'autorisait que ('buyer', 'seller') et ne
-- donnait aucun droit de modération : la page /admin ne pouvait donc
-- ni lire les annonces en attente, ni les changer d'état.

-- 1. Autorise le rôle 'admin' dans la contrainte CHECK du rôle.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('buyer', 'seller', 'admin'));

-- 2. Helper : l'utilisateur connecté a-t-il le rôle admin ?
--    security definer pour contourner RLS sans boucle infinie.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 3. L'admin peut lire tous les profils (noms de vendeurs, contacts).
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

-- 4. L'admin voit toutes les annonces, dont celles en attente.
drop policy if exists "Admins can read every listing" on public.listings;
create policy "Admins can read every listing"
  on public.listings for select to authenticated
  using (public.is_admin());

-- 5. L'admin peut changer le statut de n'importe quelle annonce
--    (validation → 'verified', rejet → 'rejected').
drop policy if exists "Admins moderate every listing" on public.listings;
create policy "Admins moderate every listing"
  on public.listings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Promotion en admin : remplacer par l'UUID de votre compte
--    (Authentication → Users dans le dashboard Supabase).
-- update public.profiles set role = 'admin' where id = 'VOTRE-UUID-Ici';
