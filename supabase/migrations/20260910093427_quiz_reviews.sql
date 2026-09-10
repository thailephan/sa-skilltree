-- Lưu tiến trình ôn tập (spaced repetition). 1 dòng/user, map JSONB: { "NODE#qIdx": {...} }.
create table if not exists public.quiz_reviews (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.quiz_reviews enable row level security;
drop policy if exists "read own reviews"   on public.quiz_reviews;
drop policy if exists "insert own reviews" on public.quiz_reviews;
drop policy if exists "update own reviews" on public.quiz_reviews;
create policy "read own reviews"   on public.quiz_reviews for select using (auth.uid() = user_id);
create policy "insert own reviews" on public.quiz_reviews for insert with check (auth.uid() = user_id);
create policy "update own reviews" on public.quiz_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
