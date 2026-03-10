'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Sun,
  Moon,
  Trash2,
  FileText,
  Lock,
  Unlock,
  LogOut,
  LogIn,
  Share2,
  Eye,
  Pencil,
} from 'lucide-react';
import { Note, SharedNote, Theme } from '../page';
import type { Session } from '@supabase/supabase-js';
import { supabaseEnabled } from '@/lib/supabase';

interface SidebarProps {
  notes: Note[];
  selectedId: string | null;
  apiKey: string;
  theme: Theme;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewNote: () => void;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onSaveApiKey: (key: string) => void;
  onToggleTheme: () => void;
  // Auth / lock props
  session: Session | null;
  sessionUnlocked: Set<string>;
  onLogout: () => void;
  onRequestLock: (noteId: string) => void;
  onRequestUnlock: (noteId: string) => void;
  onShowAuth: () => void;
  // Shared notes
  sharedNotes: SharedNote[];
  selectedSharedId: string | null;
  onSelectSharedNote: (shareId: string) => void;
}

export default function Sidebar({
  notes,
  selectedId,
  apiKey,
  theme,
  searchQuery,
  onSearchChange,
  onNewNote,
  onSelectNote,
  onDeleteNote,
  onSaveApiKey,
  onToggleTheme,
  session,
  sessionUnlocked,
  onLogout,
  onRequestLock,
  onRequestUnlock,
  onShowAuth,
  sharedNotes,
  selectedSharedId,
  onSelectSharedNote,
}: SidebarProps) {
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleSaveKey = () => {
    onSaveApiKey(apiKeyInput.trim());
    setApiKeyInput('');
    setShowApiInput(false);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Derive display name / avatar from session
  const userEmail = session?.user?.email ?? '';
  const userFullName =
    (session?.user?.user_metadata?.full_name as string | undefined) ?? '';
  const avatarUrl =
    (session?.user?.user_metadata?.avatar_url as string | undefined) ?? '';
  const displayName = userFullName || userEmail.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const panelBg = isDark
    ? 'bg-gradient-to-b from-[#13132b] to-[#0f0f22] border-r border-white/5'
    : 'bg-gradient-to-b from-white to-slate-50 border-r border-slate-200';

  const textPrimary = isDark ? 'text-slate-200' : 'text-slate-800';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark
    ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 focus:border-violet-500/50'
    : 'bg-slate-100 border-slate-200 text-slate-700 placeholder-slate-400 focus:border-violet-400';

  return (
    <div className={`flex flex-col h-full ${panelBg}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FileText size={16} className="text-white" />
            </div>
            <span className={`font-bold text-sm ${textPrimary}`}>
              NoteGenius AI
            </span>
          </div>
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`}
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm ${inputBg} transition-colors`}
          />
        </div>
      </div>

      {/* User info section (shown whenever a user is logged in) */}
      {session && (
        <div
          className={`mx-2 mt-2 mb-1 p-2 rounded-xl flex items-center gap-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}
        >
          {session ? (
            <>
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                )}
              </div>
              {/* Name / email */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${textPrimary}`}>
                  {displayName}
                </p>
                {userEmail && (
                  <p className={`text-xs truncate ${textSecondary}`}>
                    {userEmail}
                  </p>
                )}
              </div>
              {/* Logout */}
              <button
                onClick={onLogout}
                title="Sign out"
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={onShowAuth}
              className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              <LogIn size={14} />
              Sign in to sync notes
            </button>
          )}
        </div>
      )}

      {/* New Note Button */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus size={16} />
          New Note
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <p
          className={`text-xs font-semibold uppercase tracking-wider px-2 mb-2 ${textSecondary}`}
        >
          Notes ({notes.length})
        </p>
        {notes.map((note) => {
          const isLocked = !!note.is_locked;
          const isSessionUnlocked = sessionUnlocked.has(note.id);
          const showLockIcon = isLocked && !isSessionUnlocked;

          return (
            <div
              key={note.id}
              onMouseEnter={() => setHoveredId(note.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                if (isLocked && !isSessionUnlocked) {
                  onRequestUnlock(note.id);
                } else {
                  onSelectNote(note.id);
                }
              }}
              className={`group relative mb-1 p-3 rounded-xl cursor-pointer transition-all ${
                selectedId === note.id
                  ? isDark
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30'
                    : 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200'
                  : isDark
                    ? 'hover:bg-white/5 border border-transparent'
                    : 'hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {showLockIcon && (
                      <Lock size={11} className="flex-shrink-0 text-amber-400" />
                    )}
                    {isLocked && isSessionUnlocked && (
                      <Unlock
                        size={11}
                        className="flex-shrink-0 text-green-400"
                      />
                    )}
                    <p
                      className={`text-sm font-medium truncate ${
                        selectedId === note.id
                          ? isDark
                            ? 'text-violet-200'
                            : 'text-violet-700'
                          : textPrimary
                      }`}
                    >
                      {note.title || 'Untitled Note'}
                    </p>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${textSecondary}`}>
                    {showLockIcon
                      ? 'Locked note'
                      : note.content
                        ? note.content.slice(0, 50).replace(/\n/g, ' ') +
                          (note.content.length > 50 ? '...' : '')
                        : 'Empty note'}
                  </p>
                  <p className={`text-xs mt-1 ${textSecondary}`}>
                    {formatDate(note.updatedAt)}
                  </p>
                </div>

                {/* Action buttons — visible on hover */}
                {hoveredId === note.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Lock / unlock toggle (only when Supabase is configured) */}
                    {supabaseEnabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isLocked) {
                            onRequestUnlock(note.id);
                          } else {
                            onRequestLock(note.id);
                          }
                        }}
                        title={isLocked ? 'Unlock note' : 'Lock note'}
                        className={`p-1 rounded-md transition-colors ${
                          isLocked
                            ? 'text-amber-400 hover:bg-amber-400/10'
                            : isDark
                              ? 'text-slate-500 hover:text-amber-400 hover:bg-amber-400/10'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        {isLocked ? (
                          <Unlock size={12} />
                        ) : (
                          <Lock size={12} />
                        )}
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className="p-1 rounded-md text-red-400 hover:bg-red-400/10 flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {notes.length === 0 && (
          <div className={`text-center py-8 ${textSecondary} text-sm`}>
            No notes found
          </div>
        )}

        {/* Shared with me section */}
        {sharedNotes.length > 0 && (
          <div className="mt-3">
            <p
              className={`text-xs font-semibold uppercase tracking-wider px-2 mb-2 ${textSecondary}`}
            >
              Shared with me ({sharedNotes.length})
            </p>
            {sharedNotes.map((sn) => (
              <div
                key={sn.share_id}
                onClick={() => onSelectSharedNote(sn.share_id)}
                className={`group relative mb-1 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedSharedId === sn.share_id
                    ? isDark
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30'
                      : 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200'
                    : isDark
                      ? 'hover:bg-white/5 border border-transparent'
                      : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Share2 size={11} className="flex-shrink-0 text-violet-400" />
                      <p
                        className={`text-sm font-medium truncate ${
                          selectedSharedId === sn.share_id
                            ? isDark
                              ? 'text-violet-200'
                              : 'text-violet-700'
                            : textPrimary
                        }`}
                      >
                        {sn.title || 'Untitled Note'}
                      </p>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${textSecondary}`}>
                      {sn.content
                        ? sn.content.slice(0, 50).replace(/\n/g, ' ') +
                          (sn.content.length > 50 ? '...' : '')
                        : 'Empty note'}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                      sn.permission === 'editable'
                        ? isDark
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-green-50 text-green-600'
                        : isDark
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {sn.permission === 'editable' ? (
                      <Pencil size={10} />
                    ) : (
                      <Eye size={10} />
                    )}
                    {sn.permission === 'editable' ? 'Edit' : 'View'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Key Section */}
      <div className="mt-auto pt-3 border-t border-gray-700/50 flex-shrink-0">
        {!apiKey ? (
          // WARNING STATE — key not set
          <div className="mx-2 mb-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 text-sm font-semibold">
                &#9888; Groq API Key Required
              </span>
            </div>
            <p className="text-xs text-amber-300/80 mb-3 leading-relaxed">
              AI features are disabled. You need a free Groq API key to use
              Summarize, Translate, Smart Tools, and all AI features.
            </p>
            {!showApiInput ? (
              <button
                onClick={() => setShowApiInput(true)}
                className="w-full py-2 px-3 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition-colors"
              >
                How to get my free key &rarr;
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 space-y-1 bg-gray-800/50 rounded p-2 mb-2">
                  <p className="font-medium text-gray-300 mb-1">
                    Get your free Groq API key:
                  </p>
                  <p>
                    1. Go to{' '}
                    <span className="text-blue-400 font-mono text-xs">
                      console.groq.com
                    </span>
                  </p>
                  <p>2. Sign up free (Google or GitHub)</p>
                  <p>
                    3. Click{' '}
                    <span className="text-white">&ldquo;Create API Key&rdquo;</span>
                  </p>
                  <p>
                    4. Copy the key (starts with{' '}
                    <span className="font-mono text-green-400">gsk_</span>)
                  </p>
                  <p>5. Paste below and click Save</p>
                </div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                  placeholder="Paste your gsk_... key here"
                  className="w-full px-2 py-1.5 rounded text-xs bg-gray-800 border border-gray-600 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveKey}
                    className="flex-1 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
                  >
                    Save Key
                  </button>
                  <button
                    onClick={() => setShowApiInput(false)}
                    className="py-1.5 px-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ACTIVE STATE — key is set
          <div className="mx-2 mb-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-green-400 text-xs font-medium">
                AI Key Active
              </span>
            </div>
            <button
              onClick={() => setShowApiInput(true)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Change
            </button>
          </div>
        )}
        {/* Change key input shown when key is already set */}
        {apiKey && showApiInput && (
          <div className="mx-2 mb-2 space-y-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              placeholder="Paste new gsk_... key here"
              className="w-full px-2 py-1.5 rounded text-xs bg-gray-800 border border-gray-600 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveKey}
                className="flex-1 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
              >
                Update Key
              </button>
              <button
                onClick={() => {
                  setShowApiInput(false);
                  setApiKeyInput('');
                }}
                className="py-1.5 px-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
