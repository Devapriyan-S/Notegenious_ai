-- ============================================================
-- NoteGenius AI — Supabase Database Setup
-- Run this entire file in your Supabase SQL Editor
-- Go to: https://supabase.com → Your Project → SQL Editor → New Query
-- Paste this, click Run
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE 1: profiles
-- Auto-created for each user when they sign up
-- ============================================================
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  email         text,
  full_name     text,
  avatar_url    text,
  groq_api_key  text,          -- user's Groq API key (stored per account)
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

comment on table public.profiles is 'One profile per Supabase auth user';
comment on column public.profiles.groq_api_key is 'User Groq API key stored in DB (optional — also stored in localStorage)';

-- ============================================================
-- TABLE 2: notes
-- All user notes with locking support
-- ============================================================
create table public.notes (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references auth.users on delete cascade not null,
  title               text not null default 'Untitled Note',
  content             text default '' not null,
  is_locked           boolean default false not null,
  lock_password_hash  text,          -- SHA-256 hash of the lock password (hex string)
  lock_hint           text,          -- optional hint shown to user when note is locked
  is_pinned           boolean default false not null,
  color               text default 'default',   -- 'default' | 'red' | 'blue' | 'green' | 'yellow' | 'purple'
  tags                text[] default '{}' not null,
  word_count          integer default 0 not null,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

comment on table public.notes is 'User notes with optional locking';
comment on column public.notes.is_locked is 'When true, UI requires password before showing content';
comment on column public.notes.lock_password_hash is 'SHA-256 hex hash of the lock password — never store plaintext';
comment on column public.notes.lock_hint is 'Optional password hint shown to user on locked note';
comment on column public.notes.color is 'UI color tag for the note card';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Each user can ONLY see and modify their own data
-- ============================================================

alter table public.profiles enable row level security;
alter table public.notes    enable row level security;

-- Profiles policies
create policy "profiles: select own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: insert own"   on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: update own"   on public.profiles for update using (auth.uid() = id);
create policy "profiles: delete own"   on public.profiles for delete using (auth.uid() = id);

-- Notes policies
create policy "notes: select own"      on public.notes for select using (auth.uid() = user_id);
create policy "notes: insert own"      on public.notes for insert with check (auth.uid() = user_id);
create policy "notes: update own"      on public.notes for update using (auth.uid() = user_id);
create policy "notes: delete own"      on public.notes for delete using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-update updated_at on notes
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- INDEXES (for performance)
-- ============================================================
create index notes_user_id_idx      on public.notes (user_id);
create index notes_created_at_idx   on public.notes (user_id, created_at desc);
create index notes_is_pinned_idx    on public.notes (user_id, is_pinned desc);

-- ============================================================
-- HOW TO ENABLE GOOGLE LOGIN (do this in Supabase Dashboard)
-- 1. Go to Authentication → Providers
-- 2. Enable Google
-- 3. Add your Google OAuth Client ID and Secret
-- 4. Add redirect URL: http://localhost:3001 and your GitHub Pages URL
-- ============================================================

-- ============================================================
-- TABLE SUMMARY
-- ============================================================
-- profiles:
--   id, email, full_name, avatar_url, groq_api_key, created_at, updated_at
--
-- notes:
--   id, user_id, title, content,
--   is_locked, lock_password_hash, lock_hint,
--   is_pinned, color, tags, word_count,
--   created_at, updated_at
-- ============================================================
