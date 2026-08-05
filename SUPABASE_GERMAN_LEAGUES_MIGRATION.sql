-- 1. UND 2. BUNDESLIGA IM GEMEINSAMEN DATENBESTAND

alter table public.bundesliga_clubs
  add column if not exists competition_code text,
  add column if not exists competition_name text,
  add column if not exists competition_level integer;

alter table public.bundesliga_players
  add column if not exists competition_code text,
  add column if not exists competition_name text,
  add column if not exists competition_level integer;

create index if not exists bundesliga_clubs_competition_code_idx
  on public.bundesliga_clubs (competition_code);

create index if not exists bundesliga_players_competition_code_idx
  on public.bundesliga_players (competition_code);

-- Bestehende Datensätze stammen bislang aus der 1. Bundesliga.
update public.bundesliga_clubs
set competition_code = coalesce(competition_code, 'BL1'),
    competition_name = coalesce(competition_name, 'Bundesliga'),
    competition_level = coalesce(competition_level, 1);

update public.bundesliga_players
set competition_code = coalesce(competition_code, 'BL1'),
    competition_name = coalesce(competition_name, 'Bundesliga'),
    competition_level = coalesce(competition_level, 1);
