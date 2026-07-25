-- Kör hela detta i Supabase → SQL Editor → Run
-- Fixar Value Bets-cache + offentlig logg på startsidan

-- 1) Daglig cache för Value Bets
create table if not exists public.value_bets (
  valid_date date primary key,
  picks jsonb not null default '[]'::jsonb,
  fixture_scope text,
  reference_date_key text,
  created_at timestamptz not null default now()
);

alter table public.value_bets enable row level security;

-- 2) Tillåt value_bet i public track record
alter table public.public_track_picks
  drop constraint if exists public_track_picks_source_type_check;

alter table public.public_track_picks
  add constraint public_track_picks_source_type_check
  check (source_type in ('daily_slip', 'analysis', 'value_bet'));

create unique index if not exists idx_public_track_picks_source_ref
  on public.public_track_picks (source_ref)
  where source_ref is not null;

create index if not exists idx_public_track_picks_source_type
  on public.public_track_picks (source_type, published_at desc);
