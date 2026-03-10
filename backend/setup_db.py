#!/usr/bin/env python3
"""
Run this script to create the required database tables.

Usage:
    cd backend
    python3 setup_db.py

This script is an alternative to running BACKEND_SETUP.sql manually
in the Supabase SQL Editor.
"""
from database import get_db

SQL = """
-- backend_users table
CREATE TABLE IF NOT EXISTS public.backend_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT DEFAULT '' NOT NULL,
    avatar_url TEXT DEFAULT '',
    groq_api_key TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- backend_notes table
CREATE TABLE IF NOT EXISTS public.backend_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.backend_users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT DEFAULT '' NOT NULL,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    lock_password_hash TEXT,
    lock_hint TEXT,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    color TEXT DEFAULT 'default',
    tags TEXT[] DEFAULT '{}' NOT NULL,
    word_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS backend_notes_user_id_idx
    ON public.backend_notes(user_id);
CREATE INDEX IF NOT EXISTS backend_notes_updated_at_idx
    ON public.backend_notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS backend_users_email_idx
    ON public.backend_users(email);
"""

if __name__ == "__main__":
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(SQL)
            print("Tables created successfully.")
            cur.execute("SELECT COUNT(*) AS count FROM backend_users")
            result = cur.fetchone()
            count = result["count"] if isinstance(result, dict) else result[0]
            print(f"backend_users table ready ({count} existing users).")
            cur.execute("SELECT COUNT(*) AS count FROM backend_notes")
            result = cur.fetchone()
            count = result["count"] if isinstance(result, dict) else result[0]
            print(f"backend_notes table ready ({count} existing notes).")
    except Exception as e:
        print(f"ERROR: {e}")
        print()
        print("If you see a connection error, check backend/.env:")
        print("  - DATABASE_URL must be reachable from this machine")
        print("  - If using Supabase and getting IPv6 errors, enable the")
        print("    Connection Pooler in your Supabase dashboard (Settings >"
              " Database > Connection Pooling) and use the pooler URL instead.")
        raise SystemExit(1)
