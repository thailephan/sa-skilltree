-- ============================================================
-- SA Skill Tree — Supabase schema
-- Chạy nội dung file này trong Supabase Studio > SQL Editor.
-- ============================================================

-- Bảng lưu tiến độ: mỗi user 1 dòng, cột `cleared` là mảng id node đã hoàn thành.
create table if not exists public.user_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  cleared    text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Bật Row Level Security: mỗi user chỉ đọc/ghi được dòng của chính mình.
alter table public.user_progress enable row level security;

-- (idempotent) xoá policy cũ nếu chạy lại
drop policy if exists "read own progress"   on public.user_progress;
drop policy if exists "insert own progress" on public.user_progress;
drop policy if exists "update own progress" on public.user_progress;

create policy "read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tiến trình ôn tập (spaced repetition). 1 dòng/user, map JSONB "NODE#qIdx" → {streak,reps,last,due}.
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
