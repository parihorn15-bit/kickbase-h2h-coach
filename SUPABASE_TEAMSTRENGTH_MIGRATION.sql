-- EINMALIG im Supabase SQL Editor ausführen.

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
