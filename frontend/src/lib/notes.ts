import { supabase, type SupabaseNote } from './supabase';

export async function fetchNotes(userId: string): Promise<SupabaseNote[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createNote(userId: string): Promise<SupabaseNote> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, title: 'Untitled Note', content: '' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(
  id: string,
  updates: Partial<SupabaseNote>
): Promise<void> {
  const wordCount =
    updates.content !== undefined
      ? updates.content
          .trim()
          .split(/\s+/)
          .filter(Boolean).length
      : undefined;
  const { error } = await supabase
    .from('notes')
    .update({
      ...updates,
      ...(wordCount !== undefined && { word_count: wordCount }),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export async function lockNote(
  id: string,
  passwordHash: string,
  hint?: string
): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({
      is_locked: true,
      lock_password_hash: passwordHash,
      lock_hint: hint ?? null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function unlockNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ is_locked: false, lock_password_hash: null, lock_hint: null })
    .eq('id', id);
  if (error) throw error;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
