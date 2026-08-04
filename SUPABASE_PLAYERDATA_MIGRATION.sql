-- Einmalig im Supabase SQL Editor ausführen.

create table if not exists public.bundesliga_players (
  external_id integer primary key,
  name text not null,
  first_name text,
  last_name text,
  position text,
  shirt_number integer,
  date_of_birth date,
  nationality text,
  team text not null,
  team_external_id integer,
  photo_url text,
  source text not null default 'football-data.org',
  source_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.bundesliga_players enable row level security;

drop policy if exists "authenticated read bundesliga players" on public.bundesliga_players;
create policy "authenticated read bundesliga players"
on public.bundesliga_players for select to authenticated using (true);

grant select on public.bundesliga_players to authenticated;
