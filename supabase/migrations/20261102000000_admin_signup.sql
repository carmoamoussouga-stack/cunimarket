-- ══ Inscription en tant qu'administrateur (protégée par clé) ══════
--
-- Le formulaire propose « Admin » à côté de Producteur et Acheteur.
-- MAIS un simple clic ne suffit pas : il faut fournir la clé d'activation
-- ci-dessous, comparée côté serveur. Sans la bonne clé, le compte naît
-- en simple acheteur. La clé ne figure jamais dans le code JavaScript.
--
-- ► POUR CHANGER LA CLÉ : modifiez la valeur juste après l'INSERT.

create table if not exists public.app_config (
  key text primary key,
  value text not null
);

-- Personne, hors des fonctions security definer, ne doit lire cette table.
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

-- Clé d'activation du compte administrateur.
insert into public.app_config (key, value)
values ('admin_activation_key', 'CUNI-ADMIN-2026')
on conflict (key) do update set value = excluded.value;

-- ══ Trigger d'inscription réécrit ═════════════════════════════════
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
    -- Rôle admin accordé UNIQUEMENT si la clé d'activation est correcte.
    select value into v_expected from public.app_config where key = 'admin_activation_key';
    if v_expected is not null
      and (metadata ->> 'adminActivationKey') is not null
      and (metadata ->> 'adminActivationKey') = v_expected
    then
      v_role := 'admin';
      -- L'admin n'a pas besoin d'être validé par quelqu'un d'autre.
      v_status := 'verified';
    else
      -- Clé absente ou fausse : on redescend en acheteur.
      v_role := 'buyer';
    end if;
  end if;

  insert into public.profiles (
    id, role, name, phone, department, city, farm_name, years, capacity,
    specialties, latitude, longitude, verification_status
  )
  values (
    new.id,
    v_role,
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
    case when (metadata ->> 'lat') ~ '^-?[0-9]+(\.[0-9]+)?$' then (metadata ->> 'lat')::double precision else null end,
    case when (metadata ->> 'lng') ~ '^-?[0-9]+(\.[0-9]+)?$' then (metadata ->> 'lng')::double precision else null end,
    v_status
  );
  return new;
end;
$$;

-- La contrainte CHECK doit autoriser 'admin'.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('buyer', 'seller', 'admin'));
