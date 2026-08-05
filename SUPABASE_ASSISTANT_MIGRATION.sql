-- MATCHDAY ASSISTANT / NEWS INTELLIGENCE
create table if not exists public.official_club_news (
  external_id text primary key,
  team text not null,
  title text not null,
  summary text,
  url text,
  published_at timestamptz,
  source_name text not null,
  source_type text not null default 'official_rss',
  trust_score integer not null default 95,
  player_names text[] not null default '{}',
  impact_type text,
  impact_score integer not null default 0,
  keywords text[] not null default '{}',
  updated_at timestamptz not null default now(),
  raw jsonb
);

alter table public.official_club_news enable row level security;
drop policy if exists "authenticated read official club news" on public.official_club_news;
create policy "authenticated read official club news"
on public.official_club_news for select to authenticated using (true);
grant select on public.official_club_news to authenticated;
