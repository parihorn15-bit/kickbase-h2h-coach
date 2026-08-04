-- Im Supabase Dashboard unter SQL Editor ausführen.

create table if not exists public.coach_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.coach_state enable row level security;

drop policy if exists "read own coach state" on public.coach_state;
create policy "read own coach state"
on public.coach_state
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert own coach state" on public.coach_state;
create policy "insert own coach state"
on public.coach_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update own coach state" on public.coach_state;
create policy "update own coach state"
on public.coach_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete own coach state" on public.coach_state;
create policy "delete own coach state"
on public.coach_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.coach_state to authenticated;


-- Automatisch aktualisierte Bundesliga-Teamstärken
create table if not exists public.team_strengths (
  team text primary key,
  overall numeric not null,
  season_score numeric not null default 0,
  form_score numeric not null default 0,
  attack_score numeric not null default 0,
  defence_score numeric not null default 0,
  home_score numeric not null default 0,
  away_score numeric not null default 0,
  matches_played integer not null default 0,
  source text not null default 'OpenLigaDB',
  source_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.team_strengths enable row level security;

drop policy if exists "authenticated users read team strengths" on public.team_strengths;
create policy "authenticated users read team strengths"
on public.team_strengths
for select
to authenticated
using (true);

grant select on public.team_strengths to authenticated;
