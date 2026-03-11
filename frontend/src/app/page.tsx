'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AIPanel from './components/AIPanel';
import AuthModal from './components/AuthModal';
import NoteLockModal from './components/NoteLockModal';
import ShareModal from './components/ShareModal';
import { FileText, Edit3, Sparkles } from 'lucide-react';
import {
  apiGetMe,
  apiLogout,
  apiGetNotes,
  apiCreateNote,
  apiUpdateNote,
  apiDeleteNote,
  apiLockNote,
  apiGetSharedNotes,
  apiUpdateSharedNote,
  apiUpdateProfile,
} from '@/lib/api';
import type { ApiUser, ApiNote, ApiSharedNote } from '@/lib/api';

// ----------------------------------------------------------------
// Local Note type (superset of original — backward-compatible)
// ----------------------------------------------------------------
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  // Extended fields (populated when Python backend is used)
  is_locked?: boolean;
  lock_password_hash?: string | null;
  lock_hint?: string | null;
  is_pinned?: boolean;
  color?: string;
  tags?: string[];
  word_count?: number;
  user_id?: string;
}

// ----------------------------------------------------------------
// SharedNote type
// ----------------------------------------------------------------
export interface SharedNote {
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
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'dark' | 'light';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeLocalNote(title = 'Untitled Note', content = ''): Note {
  const now = Date.now();
  return { id: generateId(), title, content, createdAt: now, updatedAt: now };
}

function apiNoteToLocal(n: ApiNote): Note {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    createdAt: new Date(n.created_at).getTime(),
    updatedAt: new Date(n.updated_at).getTime(),
    is_locked: n.is_locked,
    lock_password_hash: null, // backend never exposes the hash to frontend
    lock_hint: n.lock_hint,
    is_pinned: n.is_pinned,
    color: n.color,
    tags: n.tags,
    word_count: n.word_count,
    user_id: n.user_id,
  };
}

function apiSharedNoteToLocal(n: ApiSharedNote): SharedNote {
  return {
    share_id: n.share_id,
    note_id: n.note_id,
    owner_id: n.owner_id,
    permission: n.permission,
    title: n.title,
    content: n.content,
    is_locked: n.is_locked,
    lock_hint: n.lock_hint,
    is_pinned: n.is_pinned,
    color: n.color,
    tags: n.tags,
    word_count: n.word_count,
    createdAt: new Date(n.created_at).getTime(),
    updatedAt: new Date(n.updated_at).getTime(),
  };
}

// ----------------------------------------------------------------
// Lock modal discriminated union
// ----------------------------------------------------------------
type LockModalState =
  | { open: false }
  | { open: true; mode: 'set'; noteId: string; noteTitle: string }
  | {
      open: true;
      mode: 'unlock';
      noteId: string;
      noteTitle: string;
      storedHash: string;
      lockHint: string | null;
    };

// ----------------------------------------------------------------
// Main page component
// ----------------------------------------------------------------
export default function Home() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'dark';
    }
    return 'dark';
  });
  const [notes, setNotes] = useState<Note[]>(() => [
    makeLocalNote(
      'Welcome to NoteGenius AI',
      'Start writing your notes here...\n\nTry the AI features on the right panel!'
    ),
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Mobile: which panel is active ('sidebar' | 'editor' | 'ai')
  const [mobilePanel, setMobilePanel] = useState<'sidebar' | 'editor' | 'ai'>('sidebar');

  // Auth state — Python backend user
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Lock modal
  const [lockModal, setLockModal] = useState<LockModalState>({ open: false });

  // Note IDs unlocked for this browser session (locked in DB but temporarily unlocked)
  const [sessionUnlocked, setSessionUnlocked] = useState<Set<string>>(
    new Set()
  );

  // Shared notes state
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [selectedSharedId, setSelectedSharedId] = useState<string | null>(null);
  const [shareNoteId, setShareNoteId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Debounce ref for API saves
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to current selected note — avoids stale closure in Ctrl+S handler
  const selectedNoteRef = useRef<Note | null>(null);

  // ----------------------------------------------------------------
  // Auth bootstrap — check token and fetch current user
  // ----------------------------------------------------------------
  useEffect(() => {
    apiGetMe()
      .then((user) => {
        setApiUser(user);
        setAuthLoading(false);
      })
      .catch(() => {
        setApiUser(null);
        setAuthLoading(false);
      });
  }, []);

  // ----------------------------------------------------------------
  // Load notes when user becomes available
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!apiUser) return;

    apiGetNotes()
      .then(async (rows) => {
        if (rows.length > 0) {
          const mapped = rows.map(apiNoteToLocal);
          setNotes(mapped);
          setSelectedId(mapped[0].id);
        } else {
          const row = await apiCreateNote();
          const note = apiNoteToLocal(row);
          setNotes([note]);
          setSelectedId(note.id);
        }
      })
      .catch(console.error);

    apiGetSharedNotes()
      .then((rows) => setSharedNotes(rows.map(apiSharedNoteToLocal)))
      .catch(console.error);
  }, [apiUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------------
  // Deep-link: open a specific shared or own note from URL params
  // Triggered by email links of the form /?note=<noteId>&shared=true
  // ----------------------------------------------------------------
  useEffect(() => {
    if (notes.length === 0 && sharedNotes.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('note');
    const isShared = params.get('shared') === 'true';

    if (!noteId) return;

    if (isShared) {
      const found = sharedNotes.find((n) => n.note_id === noteId);
      if (found) {
        handleSelectSharedNote(found.share_id);
        setMobilePanel('editor');
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      const found = notes.find((n) => n.id === noteId);
      if (found) {
        handleSelectNote(found.id);
        setMobilePanel('editor');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [notes, sharedNotes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------------
  // Fallback init (no user logged in): set selectedId
  // ----------------------------------------------------------------
  useEffect(() => {
    if (apiUser) return;
    setSelectedId((prev) => prev ?? notes[0]?.id ?? null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // ----------------------------------------------------------------
  // Apply theme to document
  // ----------------------------------------------------------------
  useEffect(() => {
    document.documentElement.className = theme;
    document.body.className = `antialiased h-screen overflow-hidden ${
      theme === 'dark'
        ? 'bg-[#0f0f1a] text-slate-200'
        : 'bg-slate-100 text-slate-800'
    }`;
  }, [theme]);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  // Shared note derivations
  const selectedSharedNote =
    sharedNotes.find((n) => n.share_id === selectedSharedId) ?? null;
  const isSharedNoteSelected = selectedSharedId !== null && selectedSharedNote !== null;
  const sharedReadOnly = isSharedNoteSelected && selectedSharedNote.permission === 'readable';

  // ----------------------------------------------------------------
  // Note CRUD
  // ----------------------------------------------------------------
  const handleNewNote = useCallback(async () => {
    setSelectedSharedId(null);
    if (apiUser) {
      try {
        const row = await apiCreateNote();
        const note = apiNoteToLocal(row);
        setNotes((prev) => [note, ...prev]);
        setSelectedId(note.id);
        setMobilePanel('editor');
      } catch (err) {
        console.error('Failed to create note:', err);
        // fallback: create local note
        const note = makeLocalNote();
        setNotes((prev) => [note, ...prev]);
        setSelectedId(note.id);
        setMobilePanel('editor');
      }
    } else {
      const note = makeLocalNote();
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setMobilePanel('editor');
    }
  }, [apiUser]);

  const handleSelectNote = useCallback((id: string) => {
    setSelectedSharedId(null);
    setSelectedId(id);
    setMobilePanel('editor');
  }, []);

  const handleSelectSharedNote = useCallback((shareId: string) => {
    setSelectedId(null);
    setSelectedSharedId(shareId);
    setMobilePanel('editor');
  }, []);

  const handleUpdateNote = useCallback(
    (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
      // Optimistic local update
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        )
      );

      // Debounced API save (2-second debounce)
      if (apiUser) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          apiUpdateNote(id, updates).catch(console.error);
        }, 2000);
      }
    },
    [apiUser]
  );

  const handleUpdateSharedNote = useCallback(
    (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
      // Optimistic update on shared notes list
      setSharedNotes((prev) =>
        prev.map((n) =>
          n.note_id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        )
      );
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        apiUpdateSharedNote(id, updates).catch(console.error);
      }, 2000);
    },
    []
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      setNotes((prev) => {
        const remaining = prev.filter((n) => n.id !== id);
        if (selectedId === id) {
          setSelectedId(remaining[0]?.id ?? null);
        }
        return remaining;
      });

      if (apiUser) {
        apiDeleteNote(id).catch(console.error);
      }
    },
    [selectedId, apiUser]
  );

  const handleSaveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem('groq_api_key', key);
    if (apiUser) {
      apiUpdateProfile({ groq_api_key: key }).catch(console.error);
    }
  }, [apiUser]);

  const handleApplyAIResult = useCallback(
    (result: string, mode: 'replace' | 'append') => {
      if (!selectedId) return;
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== selectedId) return n;
          const newContent =
            mode === 'replace' ? result : n.content + '\n\n' + result;
          return { ...n, content: newContent, updatedAt: Date.now() };
        })
      );

      if (apiUser) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          setNotes((current) => {
            const note = current.find((n) => n.id === selectedId);
            if (note) {
              apiUpdateNote(selectedId, { content: note.content }).catch(
                console.error
              );
            }
            return current;
          });
        }, 2000);
      }
    },
    [selectedId, apiUser]
  );

  // ----------------------------------------------------------------
  // Share handler
  // ----------------------------------------------------------------
  const handleShareNote = useCallback((noteId: string) => {
    setShareNoteId(noteId);
    setShowShareModal(true);
  }, []);

  // ----------------------------------------------------------------
  // Note locking
  // ----------------------------------------------------------------
  const handleRequestLock = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      setLockModal({ open: true, mode: 'set', noteId, noteTitle: note.title });
    },
    [notes]
  );

  const handleRequestUnlock = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note || !note.is_locked) return;

      // Already unlocked this session — just select it
      if (sessionUnlocked.has(noteId)) {
        setSelectedId(noteId);
        return;
      }

      setLockModal({
        open: true,
        mode: 'unlock',
        noteId,
        noteTitle: note.title,
        storedHash: '', // backend validates the hash; not stored on client
        lockHint: note.lock_hint ?? null,
      });
    },
    [notes, sessionUnlocked]
  );

  const handleSetLockConfirm = useCallback(
    async (noteId: string, passwordHash: string, hint: string) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                is_locked: true,
                lock_password_hash: passwordHash,
                lock_hint: hint || null,
              }
            : n
        )
      );
      setLockModal({ open: false });

      if (apiUser) {
        apiLockNote(noteId, passwordHash, hint || undefined).catch(
          console.error
        );
      }
    },
    [apiUser]
  );

  const handleUnlockConfirm = useCallback((noteId: string) => {
    setSessionUnlocked((prev) => new Set(Array.from(prev).concat(noteId)));
    setSelectedId(noteId);
    setLockModal({ open: false });
  }, []);

  const handleRemoveLock = useCallback(
    async (noteId: string) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                is_locked: false,
                lock_password_hash: null,
                lock_hint: null,
              }
            : n
        )
      );
      setSessionUnlocked((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      setLockModal({ open: false });
    },
    []
  );

  // ----------------------------------------------------------------
  // Logout
  // ----------------------------------------------------------------
  const handleLogout = useCallback(() => {
    apiLogout();
    setApiUser(null);
    setNotes([makeLocalNote()]);
    setSelectedId(null);
    setSelectedSharedId(null);
    setSharedNotes([]);
    setSessionUnlocked(new Set());
  }, []);

  // ----------------------------------------------------------------
  // Ctrl+S immediate save
  // ----------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (apiUser && selectedNoteRef.current) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          const { id, title, content } = selectedNoteRef.current;
          apiUpdateNote(id, { title, content }).catch(console.error);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [apiUser]);

  // ----------------------------------------------------------------
  // Filtered notes for sidebar search
  // ----------------------------------------------------------------
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDark = theme === 'dark';

  // Keep selectedNoteRef in sync for Ctrl+S handler
  selectedNoteRef.current = selectedNote;

  // Derive the note to show in editor
  const editorNote: Note | null = isSharedNoteSelected
    ? selectedSharedNote
      ? ({
          id: selectedSharedNote.note_id,
          title: selectedSharedNote.title,
          content: selectedSharedNote.content,
          createdAt: selectedSharedNote.createdAt,
          updatedAt: selectedSharedNote.updatedAt,
          is_locked: selectedSharedNote.is_locked,
          lock_hint: selectedSharedNote.lock_hint,
          is_pinned: selectedSharedNote.is_pinned,
          color: selectedSharedNote.color,
          tags: selectedSharedNote.tags,
          word_count: selectedSharedNote.word_count,
          user_id: selectedSharedNote.owner_id,
        } as Note)
      : null
    : selectedNote?.is_locked && !sessionUnlocked.has(selectedNote.id)
      ? null
      : selectedNote;

  // ----------------------------------------------------------------
  // Loading splash
  // ----------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f1a]">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Auth wall — no user logged in
  // ----------------------------------------------------------------
  if (!apiUser) {
    return (
      <AuthModal
        onClose={(user) => {
          if (user) {
            setApiUser(user);
          }
        }}
      />
    );
  }

  // ----------------------------------------------------------------
  // Main layout
  // ----------------------------------------------------------------
  // Build a fake Session-like object for Sidebar compatibility
  const fakeSession = apiUser
    ? ({
        user: {
          email: apiUser.email,
          user_metadata: {
            full_name: apiUser.full_name,
            avatar_url: apiUser.avatar_url,
          },
        },
      } as unknown as import('@supabase/supabase-js').Session)
    : null;

  return (
    <div
      className={`flex h-screen w-full overflow-hidden relative ${
        isDark
          ? 'bg-gradient-to-br from-[#0f0f1a] via-[#12112a] to-[#0a0a18]'
          : 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50'
      }`}
    >
      {/* Left Sidebar — always visible on md+, mobile visibility controlled by mobilePanel */}
      <div
        className={`w-72 flex-shrink-0 h-full z-40 pb-16 md:pb-0 ${
          mobilePanel === 'sidebar' ? 'flex' : 'hidden'
        } md:flex flex-col`}
      >
        {sidebarOpen && (
          <Sidebar
            notes={filteredNotes}
            selectedId={selectedId}
            apiKey={apiKey}
            theme={theme}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewNote={handleNewNote}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            onSaveApiKey={handleSaveApiKey}
            onToggleTheme={() => {
              const next = theme === 'dark' ? 'light' : 'dark';
              setTheme(next);
              localStorage.setItem('theme', next);
            }}
            session={fakeSession}
            sessionUnlocked={sessionUnlocked}
            onLogout={handleLogout}
            onRequestLock={handleRequestLock}
            onRequestUnlock={handleRequestUnlock}
            onShowAuth={() => setShowAuthModal(true)}
            sharedNotes={sharedNotes}
            selectedSharedId={selectedSharedId}
            onSelectSharedNote={handleSelectSharedNote}
          />
        )}
      </div>

      {/* Center Editor — always visible on md+, mobile visibility controlled by mobilePanel */}
      <div
        className={`flex-1 h-full overflow-hidden pb-16 md:pb-0 ${
          mobilePanel === 'editor' ? 'flex' : 'hidden'
        } md:flex flex-col`}
      >
        {!isSharedNoteSelected && selectedNote?.is_locked && !sessionUnlocked.has(selectedNote.id) ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-3xl">&#128274;</span>
            </div>
            <p className="text-slate-400 text-sm">This note is locked.</p>
            <button
              onClick={() =>
                selectedNote && handleRequestUnlock(selectedNote.id)
              }
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
            >
              Unlock Note
            </button>
          </div>
        ) : (
          <Editor
            note={editorNote}
            theme={theme}
            readOnly={sharedReadOnly}
            onUpdate={
              isSharedNoteSelected && !sharedReadOnly
                ? handleUpdateSharedNote
                : handleUpdateNote
            }
            onDelete={isSharedNoteSelected ? () => {} : handleDeleteNote}
            onShare={apiUser && !isSharedNoteSelected ? handleShareNote : undefined}
          />
        )}
      </div>

      {/* Right AI Panel — always visible on md+, mobile visibility controlled by mobilePanel */}
      <div
        className={`w-80 flex-shrink-0 h-full z-40 pb-16 md:pb-0 ${
          mobilePanel === 'ai' ? 'flex' : 'hidden'
        } md:flex flex-col`}
      >
        {aiPanelOpen && (
          <AIPanel
            note={editorNote}
            apiKey={apiKey}
            theme={theme}
            onApplyResult={handleApplyAIResult}
            onUpdate={handleUpdateNote}
          />
        )}
      </div>

      {/* Mobile bottom navigation bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t flex items-center justify-around py-2 px-4 ${
          isDark
            ? 'bg-[#13132b] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={() => setMobilePanel('sidebar')}
          className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl px-4 transition-colors ${
            mobilePanel === 'sidebar'
              ? isDark
                ? 'text-violet-400 bg-violet-500/10'
                : 'text-violet-600 bg-violet-50'
              : isDark
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={20} />
          <span className="text-xs mt-0.5">Notes</span>
        </button>
        <button
          onClick={() => setMobilePanel('editor')}
          className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl px-4 transition-colors ${
            mobilePanel === 'editor'
              ? isDark
                ? 'text-violet-400 bg-violet-500/10'
                : 'text-violet-600 bg-violet-50'
              : isDark
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Edit3 size={20} />
          <span className="text-xs mt-0.5">Editor</span>
        </button>
        <button
          onClick={() => setMobilePanel('ai')}
          className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl px-4 transition-colors ${
            mobilePanel === 'ai'
              ? isDark
                ? 'text-violet-400 bg-violet-500/10'
                : 'text-violet-600 bg-violet-50'
              : isDark
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles size={20} />
          <span className="text-xs mt-0.5">AI</span>
        </button>
      </div>

      {/* Auth modal (sign-in button in sidebar) */}
      {showAuthModal && (
        <AuthModal
          onClose={(user) => {
            if (user) setApiUser(user);
            setShowAuthModal(false);
          }}
        />
      )}

      {/* Lock modal — set */}
      {lockModal.open && lockModal.mode === 'set' && (
        <NoteLockModal
          mode="set"
          noteTitle={lockModal.noteTitle}
          onConfirm={(hash, hint) =>
            handleSetLockConfirm(lockModal.noteId, hash, hint)
          }
          onCancel={() => setLockModal({ open: false })}
        />
      )}

      {/* Lock modal — unlock */}
      {lockModal.open && lockModal.mode === 'unlock' && (
        <NoteLockModal
          mode="unlock"
          noteTitle={lockModal.noteTitle}
          lockHint={lockModal.lockHint}
          storedHash={lockModal.storedHash}
          onConfirm={() => handleUnlockConfirm(lockModal.noteId)}
          onCancel={() => setLockModal({ open: false })}
          onRemoveLock={() => handleRemoveLock(lockModal.noteId)}
        />
      )}

      {/* Share modal */}
      {showShareModal && shareNoteId && (
        <ShareModal
          noteId={shareNoteId}
          theme={theme}
          onClose={() => {
            setShowShareModal(false);
            setShareNoteId(null);
          }}
        />
      )}
    </div>
  );
}
