-- ============================================================
-- HabitLab – Complete Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PROFILES ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  username text unique,
  avatar_url text,
  personality text,
  xp_points integer default 0,
  knowledge_score integer default 0,
  is_admin boolean default false,
  is_public boolean default true,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Public profiles for leaderboard
create policy "Public profiles are viewable"
  on public.profiles for select
  using (is_public = true);

-- 2. HABITS --------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null check (category in ('fitness','study','focus','eco','health','mindset')),
  difficulty integer default 3 check (difficulty between 1 and 5),
  hypothesis text,
  independent_var text,
  dependent_var text,
  control_vars text[] default '{}',
  target_days integer default 21,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.habits enable row level security;

create policy "Users can CRUD own habits"
  on public.habits for all
  using (auth.uid() = user_id);

-- 3. DAILY LOGS ----------------------------------------------
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  completed boolean not null default false,
  completion_time text,
  mood_rating integer check (mood_rating between 1 and 5),
  energy_rating integer check (energy_rating between 1 and 5),
  notes text,
  failure_reason text,
  failure_notes text,
  created_at timestamptz default now(),
  unique (habit_id, log_date)
);

alter table public.daily_logs enable row level security;

create policy "Users can CRUD own logs"
  on public.daily_logs for all
  using (auth.uid() = user_id);

-- 4. STREAKS -------------------------------------------------
create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null unique,
  user_id uuid references public.profiles(id) on delete cascade not null,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_completed date,
  freeze_available integer default 1,
  updated_at timestamptz default now()
);

alter table public.streaks enable row level security;

create policy "Users can CRUD own streaks"
  on public.streaks for all
  using (auth.uid() = user_id);

-- 5. BADGES --------------------------------------------------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  condition text not null
);

alter table public.badges enable row level security;

create policy "Badges are readable by all"
  on public.badges for select
  using (true);

-- Seed default badges
insert into public.badges (name, description, icon_url, condition) values
  ('Consistency Starter', 'Complete a habit 7 days in a row', '🔥', 'streak_7'),
  ('Habit Champion', 'Maintain a 30-day streak', '🏆', 'streak_30'),
  ('Precision Performer', 'Achieve 90% weekly completion', '🎯', 'consistency_90'),
  ('Experimenter', 'Complete your first experiment', '🧪', 'experiment_complete')
on conflict do nothing;

-- 6. USER BADGES ---------------------------------------------
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  earned_at timestamptz default now(),
  unique (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Users can read own badges"
  on public.user_badges for all
  using (auth.uid() = user_id);

-- 7. VIDEOS --------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  title text not null,
  summary text,
  habit_category text,
  trigger_type text default 'default',
  added_by text,
  created_at timestamptz default now()
);

alter table public.videos enable row level security;

create policy "Videos are readable by all authenticated"
  on public.videos for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert videos"
  on public.videos for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete own videos"
  on public.videos for delete
  using (auth.role() = 'authenticated');

-- Seed default videos
insert into public.videos (youtube_id, title, summary, habit_category, trigger_type) values
  ('Wcs2PFz5q6g', 'The Science of Making & Breaking Habits', 'Andrew Huberman explains the neuroscience behind how habits form, how to build good ones, and how to break bad ones.', 'mindset', 'recommend'),
  ('fHBR1j1kJ1I', 'Billionaire''s Brain vs Your Brain: Morning Routine, Focus & Addiction', 'Dr. Sweta breaks down morning routines, focus strategies, and addiction science that separate high performers from the rest.', 'fitness', 'recommend'),
  ('TIwBwyMgS50', 'Small Steps, Big Changes — The Power of Habits', 'A TEDx talk by Saurabh Bothra on how small consistent habit changes lead to transformative life results.', 'study', 'default')
on conflict do nothing;

-- 8. VIDEO WATCH LOGS ----------------------------------------
create table if not exists public.video_watch_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  watched_at timestamptz default now(),
  quiz_passed boolean default false
);

alter table public.video_watch_logs enable row level security;

create policy "Users can CRUD own watch logs"
  on public.video_watch_logs for all
  using (auth.uid() = user_id);

-- 9. FUNCTION: Auto-create profile on sign-up ----------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, public.profiles.name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

-- Drop if exists, then create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Also handle profile update on sign-in (for Google OAuth metadata updates)
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. CHALLENGES -----------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  creator_id uuid references public.profiles(id) on delete set null,
  category text,
  duration_days integer default 7,
  is_public boolean default true,
  is_ai_generated boolean default false,
  start_date date default current_date,
  end_date date,
  created_at timestamptz default now()
);

alter table public.challenges enable row level security;

create policy "Challenges readable by authenticated"
  on public.challenges for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert challenges"
  on public.challenges for insert
  with check (auth.role() = 'authenticated');

create policy "Creator can update own challenges"
  on public.challenges for update
  using (auth.uid() = creator_id);

-- 11. CHALLENGE PARTICIPANTS ------------------------------------
create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  completed_days integer default 0,
  last_check_in date,
  unique (challenge_id, user_id)
);

alter table public.challenge_participants enable row level security;

create policy "Participants readable by authenticated"
  on public.challenge_participants for select
  using (auth.role() = 'authenticated');

create policy "Users can join challenges"
  on public.challenge_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update own participation"
  on public.challenge_participants for update
  using (auth.uid() = user_id);

create policy "Users can leave challenges"
  on public.challenge_participants for delete
  using (auth.uid() = user_id);
