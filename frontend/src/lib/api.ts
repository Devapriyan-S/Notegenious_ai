// DEPLOYMENT: Set NEXT_PUBLIC_API_URL in Vercel → Project Settings → Environment Variables
// to your Render backend URL, e.g. https://notegenious-backend.onrender.com
// Without this env var the app falls back to localhost and ALL API calls will fail in production.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ng_token');
}

function setToken(token: string) {
  localStorage.setItem('ng_token', token);
}

function clearToken() {
  localStorage.removeItem('ng_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error((err as { detail?: string }).detail || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Auth
export async function apiSignup(
  email: string,
  password: string,
  fullName: string
): Promise<{ message: string; email: string }> {
  return request<{ message: string; email: string }>(
    '/api/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    }
  );
}

export async function apiVerifyOtp(
  email: string,
  otp: string
): Promise<ApiUser> {
  const data = await request<{ access_token: string; user: ApiUser }>(
    '/api/auth/verify-otp',
    {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }
  );
  setToken(data.access_token);
  return data.user;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<ApiUser> {
  const data = await request<{ access_token: string; user: ApiUser }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
  setToken(data.access_token);
  return data.user;
}

export function apiLogout(): void {
  clearToken();
}

export async function apiGetMe(): Promise<ApiUser | null> {
  try {
    return await request<ApiUser>('/api/auth/me');
  } catch {
    clearToken();
    return null;
  }
}

export async function apiUpdateProfile(
  updates: Partial<{ full_name: string; groq_api_key: string }>
): Promise<ApiUser> {
  return request<ApiUser>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Notes
export async function apiGetNotes(): Promise<ApiNote[]> {
  return request<ApiNote[]>('/api/notes');
}

export async function apiCreateNote(): Promise<ApiNote> {
  return request<ApiNote>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function apiUpdateNote(
  id: string,
  updates: Partial<ApiNote>
): Promise<ApiNote> {
  return request<ApiNote>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteNote(id: string): Promise<void> {
  return request<void>(`/api/notes/${id}`, { method: 'DELETE' });
}

export async function apiLockNote(
  id: string,
  passwordHash: string,
  lockHint?: string
): Promise<ApiNote> {
  return request<ApiNote>(`/api/notes/${id}/lock`, {
    method: 'POST',
    body: JSON.stringify({ password_hash: passwordHash, lock_hint: lockHint || '' }),
  });
}

export async function apiUnlockNote(
  id: string,
  passwordHash: string
): Promise<ApiNote> {
  return request<ApiNote>(`/api/notes/${id}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ password_hash: passwordHash }),
  });
}

export async function apiRemoveLock(
  id: string,
  passwordHash: string
): Promise<ApiNote> {
  return request<ApiNote>(`/api/notes/${id}/lock`, {
    method: 'DELETE',
    body: JSON.stringify({ password_hash: passwordHash }),
  });
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Share
export async function apiCheckEmail(email: string): Promise<{ exists: boolean }> {
  return request<{ exists: boolean }>(
    `/api/auth/check-email?email=${encodeURIComponent(email)}`
  );
}

export async function apiShareNote(
  noteId: string,
  email: string,
  permission?: string
): Promise<{ invited: boolean; shared: boolean; permission?: string }> {
  return request<{ invited: boolean; shared: boolean; permission?: string }>(
    `/api/notes/${noteId}/share`,
    {
      method: 'POST',
      body: JSON.stringify({ email, permission: permission ?? null }),
    }
  );
}

export async function apiGetSharedNotes(): Promise<ApiSharedNote[]> {
  return request<ApiSharedNote[]>('/api/notes/shared');
}

export async function apiUpdateSharedNote(
  noteId: string,
  updates: Partial<{ title: string; content: string }>
): Promise<ApiNote> {
  return request<ApiNote>(`/api/notes/${noteId}/shared-content`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Types
export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  groq_api_key: string;
  created_at: string;
}

export interface ApiNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_locked: boolean;
  lock_hint: string | null;
  is_pinned: boolean;
  color: string;
  tags: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiSharedNote {
  share_id: string;
  note_id: string;
  owner_id: string;
  permission: string;
  title: string;
  content: string;
  is_locked: boolean;
  lock_hint: string | null;
  is_pinned: boolean;
  color: string;
  tags: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
}
