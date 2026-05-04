-- LockIn Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique,
  name        text not null default '',
  bio         text not null default '',
  avatar_url  text,
  twitter     text not null default '',
  instagram   text not null default '',
  website     text not null default '',
  streak      int  not null default 0,
  last_session_date text,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
create table projects (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade not null,
  name       text not null,
  color      text not null default '#E8654A',
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
create policy "Users can manage own projects" on projects for all using (auth.uid() = user_id);

-- ─── PROJECT MEMBERS ─────────────────────────────────────────────────────────
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table project_members enable row level security;
create policy "Project owners can manage members" on project_members
  for all using (
    exists (select 1 from projects where id = project_id and user_id = auth.uid())
  );
create policy "Members can view project membership" on project_members
  for select using (user_id = auth.uid());

-- ─── TASKS ───────────────────────────────────────────────────────────────────
create table tasks (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references profiles(id) on delete cascade not null,
  project_id        uuid references projects(id) on delete set null,
  title             text not null,
  notes             text not null default '',
  estimated_pomos   int  not null default 1,
  completed_pomos   int  not null default 0,
  done              boolean not null default false,
  pinned            boolean not null default false,
  assigned_to       uuid references profiles(id) on delete set null,
  assigned_by       uuid references profiles(id) on delete set null,
  assignment_status text check (assignment_status in ('pending', 'accepted', 'declined')),
  created_at        timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "Users can manage own tasks" on tasks for all using (auth.uid() = user_id);
create policy "Assignees can view and update assigned tasks" on tasks
  for select using (auth.uid() = assigned_to);
create policy "Assignees can update assigned tasks" on tasks
  for update using (auth.uid() = assigned_to);

-- ─── SESSIONS ────────────────────────────────────────────────────────────────
create table sessions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references profiles(id) on delete cascade not null,
  project_id   uuid references projects(id) on delete set null,
  task_id      uuid references tasks(id) on delete set null,
  duration     int  not null default 1500,
  mode         text not null default 'pomodoro' check (mode in ('pomodoro', 'short_break', 'long_break')),
  completed_at timestamptz not null default now()
);

alter table sessions enable row level security;
create policy "Users can manage own sessions" on sessions for all using (auth.uid() = user_id);

-- ─── SETTINGS ────────────────────────────────────────────────────────────────
create table settings (
  user_id              uuid references profiles(id) on delete cascade primary key,
  pomo_duration        int     not null default 25,
  short_break          int     not null default 5,
  long_break           int     not null default 15,
  long_break_interval  int     not null default 4,
  auto_start_break     boolean not null default false,
  auto_start_pomo      boolean not null default false,
  sound_enabled        boolean not null default true
);

alter table settings enable row level security;
create policy "Users can manage own settings" on settings for all using (auth.uid() = user_id);

-- ─── STORAGE ─────────────────────────────────────────────────────────────────
-- Run in Storage section of Supabase dashboard:
-- 1. Create bucket named "avatars" (public: true)
-- 2. Add policy: allow authenticated users to upload their own avatar
--    (path must start with their user id)
