-- ============================================================
--  MERCH PUP — Initial Schema
--  Idempotent: safe to re-run if tables/policies already exist.
--  Run this in the Supabase SQL editor (or via supabase db push)
-- ============================================================


-- ── Profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id                     uuid        references auth.users(id) on delete cascade primary key,
  name                   text,
  email                  text,
  phone                  text,
  role                   text        not null default 'fan' check (role in ('fan', 'venue')),
  stripe_account_id      text,
  stripe_charges_enabled boolean     default false,
  created_at             timestamptz default now()
);

-- Auto-populate profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'fan')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Events ───────────────────────────────────────────────────
create table if not exists public.events (
  id              uuid        default gen_random_uuid() primary key,
  owner_id        uuid        references public.profiles(id) on delete cascade,
  artist          text        not null,
  name            text,
  date            date        not null,
  venue_name      text        not null,
  city            text,
  address         text,
  description     text,
  pickup_window   text,
  directions      text[]      default '{}',
  event_code      text        not null unique,
  image_url       text,
  created_at      timestamptz default now()
);


-- ── Event Connections (fan follows an event) ─────────────────
create table if not exists public.event_connections (
  id           uuid        default gen_random_uuid() primary key,
  fan_id       uuid        references public.profiles(id) on delete cascade,
  event_id     uuid        references public.events(id) on delete cascade,
  connected_at timestamptz default now(),
  unique (fan_id, event_id)
);


-- ── Merch Items ──────────────────────────────────────────────
create table if not exists public.merch_items (
  id                  uuid           default gen_random_uuid() primary key,
  event_id            uuid           references public.events(id) on delete cascade,
  name                text           not null,
  description         text,
  price               numeric(10, 2) not null,
  sizes               text[]         default '{}',
  quantity_available  integer        default 0,
  image_url           text,
  category            text           default 'Other',
  created_at          timestamptz    default now()
);


-- ── Orders ───────────────────────────────────────────────────
create table if not exists public.orders (
  id                uuid           default gen_random_uuid() primary key,
  fan_id            uuid           references public.profiles(id),
  event_id          uuid           references public.events(id),
  qr_code           text           unique,
  stripe_session_id text           unique,
  status            text           default 'paid' check (status in ('paid', 'picked_up')),
  total             numeric(10, 2) not null,
  created_at        timestamptz    default now()
);


-- ── Order Items ──────────────────────────────────────────────
create table if not exists public.order_items (
  id            uuid           default gen_random_uuid() primary key,
  order_id      uuid           references public.orders(id) on delete cascade,
  merch_item_id uuid           references public.merch_items(id),
  name          text           not null,
  size          text,
  quantity      integer        not null,
  price         numeric(10, 2) not null
);


-- ── Row-Level Security ───────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.events            enable row level security;
alter table public.event_connections enable row level security;
alter table public.merch_items       enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;

-- profiles
do $$ begin
  create policy "Users can read own profile"
    on public.profiles for select
    using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- events
do $$ begin
  create policy "Authenticated users can view events"
    on public.events for select
    to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Venue owners can create events"
    on public.events for insert
    with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Venue owners can update their events"
    on public.events for update
    using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

-- event_connections
do $$ begin
  create policy "Fans can view their connections"
    on public.event_connections for select
    using (auth.uid() = fan_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Fans can connect to events"
    on public.event_connections for insert
    with check (auth.uid() = fan_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Fans can disconnect from events"
    on public.event_connections for delete
    using (auth.uid() = fan_id);
exception when duplicate_object then null; end $$;

-- merch_items
do $$ begin
  create policy "Authenticated users can view merch"
    on public.merch_items for select
    to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Venue owners can add merch to their events"
    on public.merch_items for insert
    with check (
      exists (
        select 1 from public.events
        where id = event_id and owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- orders
do $$ begin
  create policy "Fans can view their orders"
    on public.orders for select
    using (auth.uid() = fan_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Venue owners can view orders for their events"
    on public.orders for select
    using (
      exists (
        select 1 from public.events
        where id = event_id and owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Venue owners can update order status"
    on public.orders for update
    using (
      exists (
        select 1 from public.events
        where id = event_id and owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- order_items
do $$ begin
  create policy "Fans can view their order items"
    on public.order_items for select
    using (
      exists (
        select 1 from public.orders
        where id = order_id and fan_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Venue owners can view order items for their events"
    on public.order_items for select
    using (
      exists (
        select 1 from public.orders o
        join public.events e on o.event_id = e.id
        where o.id = order_id and e.owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;


-- ── Storage: merch-images bucket ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('merch-images', 'merch-images', true)
on conflict (id) do nothing;

do $$ begin
  create policy "Authenticated users can upload merch images"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'merch-images');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can view merch images"
    on storage.objects for select
    using (bucket_id = 'merch-images');
exception when duplicate_object then null; end $$;
