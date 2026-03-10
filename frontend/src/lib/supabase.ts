import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// supabaseEnabled is true only when both env vars are set with real values
export const supabaseEnabled =
  supabaseUrl.length > 0 &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey.length > 0 &&
  supabaseAnonKey !== 'your_supabase_anon_key';

export const supabase = createClient(
  supabaseEnabled ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseEnabled ? supabaseAnonKey : 'placeholder'
);

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  groq_api_key: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseNote = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_locked: boolean;
  lock_password_hash: string | null;
  lock_hint: string | null;
  is_pinned: boolean;
  color: string;
  tags: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
};
