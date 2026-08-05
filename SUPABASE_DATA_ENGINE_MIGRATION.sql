-- DATA ENGINE 1.0
-- Einmalig im Supabase SQL Editor ausführen.

create table if not exists public.player_availability (
  provider text not null,
  external_player_id text not null,
  player_name text not null,
  team text,
  fixture_external_id text,
  fixture_date timestamptz,
  predicted_status text,
  lineup_probability numeric,
  injury_status text,
  suspension_status text,
  is_confirmed boolean not null default false,
  provider_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  raw jsonb,
  primary key (provider, external_player_id, fixture_external_id)
);

create table if not exists public.data_sync_status (
  provider text primary key,
  status text not null,
  message text,
  records_written integer not null default 0,
  last_started_at timestamptz,
  last_success_at timestamptz,
  last_error_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.player_availability enable row level security;
alter table public.data_sync_status enable row level security;

drop policy if exists "authenticated read player availability" on public.player_availability;
create policy "authenticated read player availability"
on public.player_availability for select to authenticated using (true);

drop policy if exists "authenticated read data sync status" on public.data_sync_status;
create policy "authenticated read data sync status"
on public.data_sync_status for select to authenticated using (true);

grant select on public.player_availability to authenticated;
grant select on public.data_sync_status to authenticated;
