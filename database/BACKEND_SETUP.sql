-- ============================================================
-- NoteGenius AI — Python Backend Tables
-- Run this in Supabase SQL Editor AFTER running SUPABASE_SETUP.sql
-- ============================================================

-- Users table (Python backend manages its own auth)
create table if not exists public.backend_users (
  id              uuid default uuid_generate_v4() primary key,
  email           text unique not null,
  password_hash   text not null,
  full_name       text default '' not null,
  avatar_url      text default '',
  groq_api_key    text default '',
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- Notes table managed by Python backend
create table if not exists public.backend_notes (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references public.backend_users(id) on delete cascade not null,
  title               text not null default 'Untitled Note',
  content             text default '' not null,
  is_locked           boolean default false not null,
  lock_password_hash  text,
  lock_hint           text,
  is_pinned           boolean default false not null,
  color               text default 'default',
  tags                text[] default '{}' not null,
  word_count          integer default 0 not null,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

-- Enable RLS
alter table public.backend_users enable row level security;
alter table public.backend_notes enable row level security;

-- Allow backend service to bypass RLS (Python uses direct connection)
-- No RLS policies needed — Python backend verifies JWT and filters by user_id

-- Indexes
create index if not exists backend_notes_user_id_idx on public.backend_notes(user_id);
create index if not exists backend_notes_updated_at_idx on public.backend_notes(user_id, updated_at desc);
create index if not exists backend_users_email_idx on public.backend_users(email);

-- Auto-update updated_at trigger for backend_notes
create or replace function public.handle_backend_notes_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger backend_notes_updated_at
  before update on public.backend_notes
  for each row execute function public.handle_backend_notes_updated_at();

create or replace function public.handle_backend_users_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger backend_users_updated_at
  before update on public.backend_users
  for each row execute function public.handle_backend_users_updated_at();
