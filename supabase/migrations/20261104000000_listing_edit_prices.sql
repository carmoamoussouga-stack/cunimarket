-- Prix de référence facultatif pour afficher une remise sur les annonces.
alter table public.listings
  add column if not exists original_price integer;

alter table public.listings
  drop constraint if exists listings_original_price_check;
alter table public.listings
  add constraint listings_original_price_check
  check (original_price is null or (original_price > 0 and original_price >= price));

-- Seuls les comptes producteurs approuvés peuvent publier ou modifier une annonce.
drop policy if exists "Sellers create their own unverified listings" on public.listings;
create policy "Approved sellers create their own listings"
  on public.listings for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and verification_status = 'pending'
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'seller'
        and profile.verification_status = 'verified'
    )
  );

drop policy if exists "Sellers edit their own unverified listings" on public.listings;
create policy "Approved sellers edit their own listings"
  on public.listings for update to authenticated
  using (
    seller_id = (select auth.uid())
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'seller'
        and profile.verification_status = 'verified'
    )
  )
  with check (
    seller_id = (select auth.uid())
    and verification_status = 'pending'
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'seller'
        and profile.verification_status = 'verified'
    )
  );

drop policy if exists "Sellers delete their own unverified listings" on public.listings;
create policy "Approved sellers archive their own listings"
  on public.listings for delete to authenticated
  using (
    seller_id = (select auth.uid())
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'seller'
        and profile.verification_status = 'verified'
    )
  );

create or replace function public.is_approved_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'seller'
      and verification_status = 'verified'
  );
$$;

revoke all on function public.is_approved_seller() from public;
grant execute on function public.is_approved_seller() to authenticated;

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
    raise exception 'An approved seller on this order is required';
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
    raise exception 'An approved seller on this order is required';
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
