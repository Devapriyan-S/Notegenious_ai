'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Share2, Eye, Pencil, Loader2, CheckCircle } from 'lucide-react';
import { Theme } from '../page';
import { apiCheckEmail, apiShareNote } from '@/lib/api';

interface ShareModalProps {
  noteId: string;
  theme: Theme;
  onClose: () => void;
}

export default function ShareModal({ noteId, theme, onClose }: ShareModalProps) {
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ exists: boolean } | null>(null);
  const [permission, setPermission] = useState<'readable' | 'editable'>('readable');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ invited?: boolean; shared?: boolean; permission?: string } | null>(null);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkEmail = useCallback(async (val: string) => {
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setCheckResult(null);
      return;
    }
    setChecking(true);
    setError('');
    try {
      const res = await apiCheckEmail(val);
      setCheckResult(res);
    } catch {
      setCheckResult(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    setCheckResult(null);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkEmail(email), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email, checkEmail]);

  // Auto-close 2s after success
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(t);
  }, [result, onClose]);

  const handleSubmit = async () => {
    if (!email || !checkResult) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiShareNote(
        noteId,
        email,
        checkResult.exists ? permission : undefined
      );
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const modalBg = isDark
    ? 'bg-[#16162a] border border-white/10'
    : 'bg-white border border-slate-200';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-800';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputClass = isDark
    ? 'bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none rounded-lg px-3 py-2 text-sm w-full'
    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none rounded-lg px-3 py-2 text-sm w-full';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${modalBg}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-violet-400" />
            <h2 className={`text-base font-semibold ${textPrimary}`}>Share Note</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share modal"
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {result ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={40} className="text-green-400" />
              <p className={`text-sm font-medium ${textPrimary}`}>
                {result.invited
                  ? 'Invitation sent!'
                  : `Note shared as "${result.permission === 'readable' ? 'Read only' : 'Read & Edit'}"`}
              </p>
              <p className={`text-xs ${textSecondary}`}>Closing automatically...</p>
            </div>
          ) : (
            <>
              {/* Email input */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to share with..."
                    className={inputClass}
                    autoFocus
                  />
                  {checking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={14} className="animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Status feedback */}
              {checkResult !== null && !checking && email && (
                <div>
                  {checkResult.exists ? (
                    <div className="space-y-3">
                      <p className={`text-xs ${textSecondary}`}>
                        This user is registered. Choose their access level:
                      </p>
                      <div className="space-y-2">
                        <label
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                            permission === 'readable'
                              ? isDark
                                ? 'border-violet-500/50 bg-violet-500/10'
                                : 'border-violet-400 bg-violet-50'
                              : isDark
                                ? 'border-white/10 hover:border-white/20'
                                : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="permission"
                            value="readable"
                            checked={permission === 'readable'}
                            onChange={() => setPermission('readable')}
                            className="sr-only"
                          />
                          <Eye
                            size={16}
                            className={permission === 'readable' ? 'text-violet-400' : textSecondary}
                          />
                          <div>
                            <p className={`text-sm font-medium ${textPrimary}`}>Read only</p>
                            <p className={`text-xs ${textSecondary}`}>Can view but not edit</p>
                          </div>
                        </label>
                        <label
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                            permission === 'editable'
                              ? isDark
                                ? 'border-violet-500/50 bg-violet-500/10'
                                : 'border-violet-400 bg-violet-50'
                              : isDark
                                ? 'border-white/10 hover:border-white/20'
                                : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="permission"
                            value="editable"
                            checked={permission === 'editable'}
                            onChange={() => setPermission('editable')}
                            className="sr-only"
                          />
                          <Pencil
                            size={16}
                            className={permission === 'editable' ? 'text-violet-400' : textSecondary}
                          />
                          <div>
                            <p className={`text-sm font-medium ${textPrimary}`}>Read &amp; Edit</p>
                            <p className={`text-xs ${textSecondary}`}>Can view and make changes</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-xl ${
                        isDark
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        This email is not registered. Clicking &quot;Send Invite&quot; will send them
                        an invitation to join NoteGenius AI.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-xs text-red-400">{error}</p>}

              {/* Action button */}
              <button
                onClick={handleSubmit}
                disabled={!email || !checkResult || submitting || checking}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : checkResult?.exists === false ? (
                  'Send Invite'
                ) : (
                  'Share Note'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
