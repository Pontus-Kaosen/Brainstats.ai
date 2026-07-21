alter table public.analyses add column if not exists worth_betting jsonb;
alter table public.analyses add column if not exists used_data jsonb;
alter table public.analyses add column if not exists score_breakdown jsonb;
alter table public.analyses add column if not exists bet_text text;
