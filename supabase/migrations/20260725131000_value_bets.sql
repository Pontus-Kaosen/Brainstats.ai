create table if not exists public.value_bets (
  valid_date date primary key,
  picks jsonb not null default '[]'::jsonb,
  fixture_scope text,
  reference_date_key text,
  created_at timestamptz not null default now()
);

alter table public.value_bets enable row level security;
