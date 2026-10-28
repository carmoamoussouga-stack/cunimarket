create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'buyer' check (role in ('buyer', 'seller')),
  name text not null,
  phone text not null default '',
  department text not null default '',
  city text not null default '',
  farm_name text,
  years integer check (years is null or years >= 0),
  capacity text,
  specialties text[] not null default '{}',
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (
    id, role, name, phone, department, city, farm_name, years, capacity,
    specialties, latitude, longitude
  )
  values (
    new.id,
    case when metadata ->> 'role' = 'seller' then 'seller' else 'buyer' end,
    coalesce(nullif(metadata ->> 'name', ''), split_part(new.email, '@', 1)),
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
    case when (metadata ->> 'lat') ~ '^-?[0-9]+(\\.[0-9]+)?$' then (metadata ->> 'lat')::double precision else null end,
    case when (metadata ->> 'lng') ~ '^-?[0-9]+(\\.[0-9]+)?$' then (metadata ->> 'lng')::double precision else null end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (length(trim(title)) between 3 and 120),
  category text not null,
  price integer not null check (price > 0),
  unit text not null default '',
  quantity integer not null check (quantity >= 0),
  breed text,
  age_days integer check (age_days is null or age_days >= 0),
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  vaccinated boolean not null default false,
  sex text,
  photos text[] not null default '{}',
  seller_name text not null,
  department text not null,
  city text not null,
  emoji text not null default '🐇',
  background_color text not null default '#e8f5e9',
  latitude double precision,
  longitude double precision,
  description text not null default '',
  active boolean not null default true,
  archived boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create index listings_active_created_idx on public.listings (active, created_at desc);
create index listings_seller_idx on public.listings (seller_id, created_at desc);

grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text not null default '',
  delivery_city text not null,
  delivery_mode text not null check (delivery_mode in ('pickup', 'moto', 'transport')),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total = subtotal + delivery_fee - discount),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
  payment_method text not null default 'cash_on_delivery'
    check (payment_method = 'cash_on_delivery'),
  payment_status text not null default 'due_on_delivery'
    check (payment_status in ('due_on_delivery', 'paid')),
  created_at timestamptz not null default now()
);

create index orders_buyer_created_idx on public.orders (buyer_id, created_at desc);
grant select on public.orders to authenticated;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  title_snapshot text not null,
  unit_price integer not null check (unit_price > 0),
  quantity integer not null check (quantity > 0),
  emoji text not null default '🐇',
  background_color text not null default '#e8f5e9',
  unique (order_id, listing_id)
);

create index order_items_seller_idx on public.order_items (seller_id, order_id);
grant select on public.order_items to authenticated;

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete restrict,
  listing_id uuid not null references public.listings (id) on delete cascade,
  reason text not null check (length(trim(reason)) between 5 and 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);
grant insert on public.listing_reports to authenticated;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.listing_reports enable row level security;

revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (
  name, phone, department, city, farm_name, years, capacity, specialties, latitude, longitude
) on public.profiles to authenticated;

create policy "Profiles are visible to their owner"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Active listings are public"
  on public.listings for select to anon, authenticated
  using ((active and verification_status = 'verified') or seller_id = (select auth.uid()));
create policy "Sellers create their own unverified listings"
  on public.listings for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and verification_status = 'pending'
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'seller'
    )
  );
create policy "Sellers edit their own unverified listings"
  on public.listings for update to authenticated
  using (seller_id = (select auth.uid()) and verification_status = 'pending')
  with check (seller_id = (select auth.uid()) and verification_status = 'pending');
create policy "Sellers delete their own unverified listings"
  on public.listings for delete to authenticated
  using (seller_id = (select auth.uid()) and verification_status = 'pending');

create function public.is_order_seller(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.order_items oi
    where oi.order_id = p_order_id and oi.seller_id = (select auth.uid())
  );
$$;

revoke all on function public.is_order_seller(uuid) from public;
grant execute on function public.is_order_seller(uuid) to authenticated;

create policy "Buyers and sellers can read relevant orders"
  on public.orders for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or public.is_order_seller(id)
  );
create policy "Relevant users can read order items"
  on public.order_items for select to authenticated
  using (
    seller_id = (select auth.uid())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = (select auth.uid())
    )
  );
create policy "Users submit reports for themselves"
  on public.listing_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create function public.place_order(
  p_items jsonb,
  p_delivery_mode text,
  p_buyer_name text,
  p_buyer_phone text,
  p_buyer_email text,
  p_delivery_city text,
  p_coupon_code text default ''
)
returns table (
  order_id uuid,
  order_reference text,
  order_subtotal integer,
  order_delivery_fee integer,
  order_discount integer,
  order_total integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_order_id uuid;
  v_reference text;
  v_subtotal integer;
  v_delivery_fee integer;
  v_discount integer;
  v_item_count integer;
begin
  if v_buyer_id is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  if p_delivery_mode not in ('pickup', 'moto', 'transport') then
    raise exception 'Unsupported delivery mode';
  end if;
  if length(trim(p_buyer_name)) = 0 or length(trim(p_buyer_phone)) < 6
    or length(trim(p_delivery_city)) = 0 then
    raise exception 'Buyer contact and delivery city are required';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
    where item.listing_id is null or item.quantity is null or item.quantity < 1
  ) then
    raise exception 'Invalid order item';
  end if;

  select count(*), sum(item.quantity * listing.price)
  into v_item_count, v_subtotal
  from (
    select listing_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
    group by listing_id
  ) item
  join public.listings listing
    on listing.id = item.listing_id and listing.active and listing.verification_status = 'verified';

  if v_item_count <> (
    select count(distinct item.listing_id)
    from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
  ) then
    raise exception 'One or more listings are unavailable';
  end if;

  perform listing.id
  from public.listings listing
  join (
    select listing_id
    from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
    group by listing_id
  ) requested on requested.listing_id = listing.id
  order by listing.id
  for update;

  if exists (
    select 1
    from (
      select listing_id, sum(quantity)::integer as quantity
      from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
      group by listing_id
    ) item
    join public.listings listing on listing.id = item.listing_id
    where not listing.active or listing.verification_status <> 'verified'
      or listing.quantity < item.quantity or listing.seller_id = v_buyer_id
  ) then
    raise exception 'A listing is unavailable, out of stock, or belongs to the buyer';
  end if;

  select sum(item.quantity * listing.price)::integer
  into v_subtotal
  from (
    select listing_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
    group by listing_id
  ) item
  join public.listings listing on listing.id = item.listing_id;

  v_delivery_fee := case p_delivery_mode
    when 'pickup' then 0
    when 'moto' then 2000
    when 'transport' then 5000
  end;
  v_discount := case when upper(trim(coalesce(p_coupon_code, ''))) = 'CUNIMARKET10'
    then round(v_subtotal * 0.1)::integer
    else 0
  end;
  v_reference := '#CMK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    reference, buyer_id, buyer_name, buyer_phone, buyer_email, delivery_city,
    delivery_mode, subtotal, delivery_fee, discount, total
  )
  values (
    v_reference, v_buyer_id, trim(p_buyer_name), trim(p_buyer_phone),
    coalesce(trim(p_buyer_email), ''), trim(p_delivery_city), p_delivery_mode,
    v_subtotal, v_delivery_fee, v_discount, v_subtotal + v_delivery_fee - v_discount
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, listing_id, seller_id, title_snapshot, unit_price, quantity, emoji, background_color
  )
  select v_order_id, listing.id, listing.seller_id, listing.title, listing.price, requested.quantity,
    listing.emoji, listing.background_color
  from (
    select listing_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
    group by listing_id
  ) requested
  join public.listings listing on listing.id = requested.listing_id;

  update public.listings listing
  set quantity = listing.quantity - requested.quantity,
      active = listing.quantity - requested.quantity > 0,
      updated_at = now()
  from (
    select listing_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(listing_id uuid, quantity integer)
    group by listing_id
  ) requested
  where listing.id = requested.listing_id;

  return query select
    v_order_id, v_reference, v_subtotal, v_delivery_fee, v_discount,
    v_subtotal + v_delivery_fee - v_discount;
end;
$$;

revoke all on function public.place_order(jsonb, text, text, text, text, text, text) from public;
grant execute on function public.place_order(jsonb, text, text, text, text, text, text) to authenticated;

create function public.seller_update_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status text;
begin
  if auth.uid() is null or not public.is_order_seller(p_order_id) then
    raise exception 'Only a seller on this order can update its status';
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

create function public.seller_complete_cash_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status text;
begin
  if auth.uid() is null or not public.is_order_seller(p_order_id) then
    raise exception 'Only a seller on this order can complete it';
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
