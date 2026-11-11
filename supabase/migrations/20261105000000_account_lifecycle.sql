-- Adresse de contact visible uniquement par son propriétaire et les admins.
alter table public.profiles
  add column if not exists email text not null default '';

update public.profiles profile
set email = coalesce(auth_user.email, '')
from auth.users auth_user
where auth_user.id = profile.id
  and profile.email = '';

alter table public.profiles
  add column if not exists account_status text not null default 'active';

alter table public.listings
  add column if not exists original_price integer;

alter table public.listings
  drop constraint if exists listings_original_price_check;
alter table public.listings
  add constraint listings_original_price_check
  check (original_price is null or (original_price > 0 and original_price >= price));

alter table public.profiles
  drop constraint if exists profiles_account_status_check;
alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended'));

-- Les nouveaux comptes conservent le rôle demandé, mais restent à valider.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
  v_role text := 'buyer';
  v_status text := 'pending';
  v_expected text;
begin
  if metadata ->> 'role' = 'seller' then
    v_role := 'seller';
  elsif metadata ->> 'role' = 'admin' then
    select value into v_expected
    from public.app_config
    where key = 'admin_activation_key';
    if v_expected is not null
      and metadata ->> 'adminActivationKey' = v_expected then
      v_role := 'admin';
      v_status := 'verified';
    end if;
  end if;

  insert into public.profiles (
    id, role, name, email, phone, department, city, farm_name, years, capacity,
    specialties, latitude, longitude, verification_status, account_status
  )
  values (
    new.id,
    v_role,
    coalesce(nullif(metadata ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    coalesce(metadata ->> 'phone', ''),
    coalesce(metadata ->> 'dept', ''),
    coalesce(metadata ->> 'city', ''),
    nullif(metadata ->> 'farmName', ''),
    case when (metadata ->> 'years') ~ '^[0-9]+$' then (metadata ->> 'years')::integer else null end,
    nullif(metadata ->> 'capacity', ''),
    case when jsonb_typeof(metadata -> 'specialties') = 'array'
      then array(select jsonb_array_elements_text(metadata -> 'specialties'))
      else '{}'::text[]
    end,
    case when (metadata ->> 'lat') ~ '^-?[0-9]+(\.[0-9]+)?$' then (metadata ->> 'lat')::double precision else null end,
    case when (metadata ->> 'lng') ~ '^-?[0-9]+(\.[0-9]+)?$' then (metadata ->> 'lng')::double precision else null end,
    v_status,
    'active'
  );
  return new;
end;
$$;

create or replace function public.is_active_approved_seller(p_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_seller_id
      and role = 'seller'
      and verification_status = 'verified'
      and account_status = 'active'
  );
$$;

revoke all on function public.is_active_approved_seller(uuid) from public;
grant execute on function public.is_active_approved_seller(uuid) to anon, authenticated;

create or replace function public.is_approved_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_active_approved_seller((select auth.uid()));
$$;

revoke all on function public.is_approved_seller() from public;
grant execute on function public.is_approved_seller() to authenticated;

drop policy if exists "Active listings are public" on public.listings;
create policy "Active approved seller listings are public"
  on public.listings for select to anon, authenticated
  using (
    (
      active
      and verification_status = 'verified'
      and public.is_active_approved_seller(seller_id)
    )
    or seller_id = (select auth.uid())
  );

drop policy if exists "Approved sellers create their own listings" on public.listings;
drop policy if exists "Sellers create their own unverified listings" on public.listings;
create policy "Approved sellers create their own listings"
  on public.listings for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and verification_status = 'pending'
    and public.is_approved_seller()
  );

drop policy if exists "Approved sellers edit their own listings" on public.listings;
drop policy if exists "Sellers edit their own unverified listings" on public.listings;
create policy "Approved sellers edit their own listings"
  on public.listings for update to authenticated
  using (seller_id = (select auth.uid()) and public.is_approved_seller())
  with check (
    seller_id = (select auth.uid())
    and verification_status = 'pending'
    and public.is_approved_seller()
  );

drop policy if exists "Approved sellers archive their own listings" on public.listings;
drop policy if exists "Sellers delete their own unverified listings" on public.listings;
create policy "Approved sellers archive their own listings"
  on public.listings for delete to authenticated
  using (seller_id = (select auth.uid()) and public.is_approved_seller());

create or replace function public.admin_set_account_verification(
  p_account_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('verified', 'rejected') then
    raise exception 'Unsupported account verification status';
  end if;
  update public.profiles
  set verification_status = p_status
  where id = p_account_id and role in ('buyer', 'seller');
  if not found then
    raise exception 'Account not found or cannot be moderated';
  end if;
end;
$$;

create or replace function public.admin_set_account_status(
  p_account_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_verification_status text;
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'Unsupported account status';
  end if;

  select verification_status, role
  into v_verification_status, v_role
  from public.profiles
  where id = p_account_id
  for update;
  if not found or v_role = 'admin' then
    raise exception 'Account not found or cannot be deactivated';
  end if;
  if p_status = 'active' and v_verification_status <> 'verified' then
    raise exception 'Approve the account before reactivating it';
  end if;

  update public.profiles
  set account_status = p_status
  where id = p_account_id;
end;
$$;

revoke all on function public.admin_set_account_verification(uuid, text) from public;
revoke all on function public.admin_set_account_status(uuid, text) from public;
grant execute on function public.admin_set_account_verification(uuid, text) to authenticated;
grant execute on function public.admin_set_account_status(uuid, text) to authenticated;

create or replace function public.seller_update_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status text;
begin
  if auth.uid() is null or not public.is_approved_seller()
    or not public.is_order_seller(p_order_id) then
    raise exception 'An active, approved seller on this order is required';
  end if;

  select status into v_current_status
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if not (
    (v_current_status = 'pending' and p_status in ('confirmed', 'cancelled'))
    or (v_current_status = 'confirmed' and p_status in ('shipping', 'cancelled'))
  ) then
    raise exception 'Invalid order status transition';
  end if;
  if p_status = 'cancelled' then
    update public.listings listing
    set quantity = listing.quantity + item.quantity,
        active = not listing.archived,
        updated_at = now()
    from public.order_items item
    where item.order_id = p_order_id and item.listing_id = listing.id;
  end if;

  update public.orders
  set status = p_status
  where id = p_order_id;
end;
$$;

revoke all on function public.seller_update_order_status(uuid, text) from public;
grant execute on function public.seller_update_order_status(uuid, text) to authenticated;

create or replace function public.seller_complete_cash_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status text;
begin
  if auth.uid() is null or not public.is_approved_seller()
    or not public.is_order_seller(p_order_id) then
    raise exception 'An active, approved seller on this order is required';
  end if;

  select status into v_current_status
  from public.orders
  where id = p_order_id
  for update;
  if v_current_status <> 'shipping' then
    raise exception 'Only an order in delivery can be completed';
  end if;

  update public.orders
  set status = 'delivered', payment_status = 'paid'
  where id = p_order_id;
end;
$$;

revoke all on function public.seller_complete_cash_order(uuid) from public;
grant execute on function public.seller_complete_cash_order(uuid) to authenticated;

create or replace function public.ensure_active_approved_buyer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.buyer_id
      and role = 'buyer'
      and verification_status = 'verified'
      and account_status = 'active'
  ) then
    raise exception 'An active, approved buyer account is required';
  end if;
  return new;
end;
$$;

create trigger ensure_active_approved_buyer_before_order
  before insert on public.orders
  for each row execute function public.ensure_active_approved_buyer();

create or replace function public.ensure_active_approved_order_sellers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_approved_seller(new.seller_id) then
    raise exception 'An active, approved seller account is required';
  end if;
  return new;
end;
$$;

create trigger ensure_active_approved_sellers_before_order_items
  before insert on public.order_items
  for each row execute function public.ensure_active_approved_order_sellers();

revoke all on function public.ensure_active_approved_buyer() from public;
revoke all on function public.ensure_active_approved_order_sellers() from public;
