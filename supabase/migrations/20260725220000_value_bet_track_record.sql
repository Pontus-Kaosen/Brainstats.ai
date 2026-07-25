-- Allow value_bet in public track record
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
