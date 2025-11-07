-- /sql/policies.sql
-- Note : on MVP on laisse lecture publique, écriture limitée
-- Activer RLS sur devices si on a auth
alter table public.devices enable row level security;

-- Allow anonymous read on devices (public verification)
create policy "public device read" on public.devices
  for select
  using (true);

-- For inserts/updates: placeholder policy (adjust when we add auth)
-- For now allow all inserts (we will validate with RPC register_device)
create policy "allow insert" on public.devices
  for insert
  using (true);

-- device_audit: write by server / RPC only
alter table public.device_audit enable row level security;
create policy "server insert" on public.device_audit
  for insert
  using (true);
