-- NoteGenius AI — note_shares table migration
-- Run this in your PostgreSQL database (Supabase SQL Editor or psql)
-- This must be run AFTER BACKEND_SETUP.sql

CREATE TABLE IF NOT EXISTS public.note_shares (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  note_id              UUID REFERENCES public.backend_notes(id) ON DELETE CASCADE NOT NULL,
  owner_id             UUID REFERENCES public.backend_users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id  UUID REFERENCES public.backend_users(id) ON DELETE CASCADE NOT NULL,
  permission           VARCHAR(10) NOT NULL CHECK (permission IN ('readable', 'editable')),
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (note_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS note_shares_shared_with_idx ON public.note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS note_shares_note_id_idx ON public.note_shares(note_id);
