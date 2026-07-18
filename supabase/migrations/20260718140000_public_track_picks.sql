-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- Creates public track record storage for resolved AI picks.

create table if not exists public.public_track_picks (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('daily_slip', 'analysis')),
  source_ref text,
  fixture_id integer not null,
  match_label text not null,
  market text not null,
  brain_score integer,
  safety_tier smallint check (safety_tier between 1 and 5),
  probability integer,
  published_at timestamptz not null default now(),
  kickoff_at timestamptz,
  outcome text not null default 'pending'
    check (outcome in ('pending', 'won', 'lost', 'void')),
  resolved_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_public_track_picks_outcome
  on public.public_track_picks (outcome);

create index if not exists idx_public_track_picks_published
  on public.public_track_picks (published_at desc);

create index if not exists idx_public_track_picks_fixture
  on public.public_track_picks (fixture_id);

alter table public.public_track_picks enable row level security;

drop policy if exists "Public read track picks" on public.public_track_picks;
create policy "Public read track picks"
  on public.public_track_picks
  for select
  using (true);
