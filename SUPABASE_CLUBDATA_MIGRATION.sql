-- Einmalig im Supabase SQL Editor ausführen.
create table if not exists public.bundesliga_clubs (
  team text primary key,
  short_name text,
  crest_url text,
  coach text,
  venue text,
  position integer,
  points integer,
  played integer,
  won integer,
  drawn integer,
  lost integer,
  goals_for integer,
  goals_against integer,
  goal_difference integer,
  form text,
  next_match jsonb,
  source text not null default 'football-data.org',
  source_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.bundesliga_clubs enable row level security;

drop policy if exists "authenticated read bundesliga clubs" on public.bundesliga_clubs;
create policy "authenticated read bundesliga clubs"
on public.bundesliga_clubs for select to authenticated using (true);

grant select on public.bundesliga_clubs to authenticated;
