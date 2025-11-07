-- /sql/schema.sql

-- devices : capitale pour GD-Code
create table if not exists public.devices (
  id uuid default gen_random_uuid() primary key,
  gomadeal_code text not null unique, -- ex: GD-00023
  imei text not null,
  brand text,
  model text,
  status text not null default 'ok', -- ok | lost | found
  owner_contact text, -- phone or email (public contact minimal)
  image_path text, -- Supabase Storage path (public URL built client-side)
  registered_paid boolean default false,
  created_at timestamptz default now()
);

create unique index on public.devices (imei);

-- device_audit : simple journal
create table if not exists public.device_audit (
  id bigserial primary key,
  device_id uuid references public.devices(id) on delete cascade,
  action text not null,
  by_user text,
  meta jsonb,
  created_at timestamptz default now()
);

-- lost_reports
create table if not exists public.lost_reports (
  id uuid default gen_random_uuid() primary key,
  imei text,
  description text,
  reporter_contact text,
  status text default 'active', -- active | resolved
  matched_device_id uuid references public.devices(id),
  created_at timestamptz default now()
);

-- ads (phase market)
create table if not exists public.ads (
  id uuid default gen_random_uuid() primary key,
  device_id uuid references public.devices(id),
  price numeric,
  description text,
  seller_contact text,
  active boolean default true,
  views_count int default 0,
  created_at timestamptz default now()
);
