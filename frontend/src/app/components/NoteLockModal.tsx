'use client';
import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, X, ShieldCheck, Unlock } from 'lucide-react';
import { hashPassword } from '@/lib/notes';

interface SetLockProps {
  mode: 'set';
  noteTitle: string;
  onConfirm: (passwordHash: string, hint: string) => Promise<void>;
  onCancel: () => void;
}

interface UnlockProps {
  mode: 'unlock';
  noteTitle: string;
  lockHint: string | null;
  storedHash: string;
  onConfirm: () => void; // called when password matches
  onCancel: () => void;
  onRemoveLock: (passwordHash: string) => Promise<void>; // permanently removes lock
}

type NoteLockModalProps = SetLockProps | UnlockProps;

export default function NoteLockModal(props: NoteLockModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetLock = async () => {
    if (!password) { setError('Enter a password.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const hash = await hashPassword(password);
      await (props as SetLockProps).onConfirm(hash, hint.trim());
    } catch {
      setError('Failed to lock note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!password) { setError('Enter the password.'); return; }
    setError('');
    setLoading(true);
    try {
      const hash = await hashPassword(password);
      const p = props as UnlockProps;
      if (hash === p.storedHash) {
        p.onConfirm();
      } else {
        setError('Incorrect password. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLock = async () => {
    if (!password) { setError('Enter the password to remove the lock.'); return; }
    setError('');
    setLoading(true);
    try {
      const hash = await hashPassword(password);
      const p = props as UnlockProps;
      if (hash === p.storedHash) {
        await p.onRemoveLock(hash);
      } else {
        setError('Incorrect password.');
      }
    } catch {
      setError('Failed to remove lock.');
    } finally {
      setLoading(false);
    }
  };

  const isSetMode = props.mode === 'set';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {isSetMode ? (
              <ShieldCheck size={20} className="text-purple-400" />
            ) : (
              <Unlock size={20} className="text-amber-400" />
            )}
            <h2 className="text-white font-semibold text-sm">
              {isSetMode ? 'Lock Note' : 'Unlock Note'}
            </h2>
          </div>
          <button
            onClick={props.onCancel}
            className="text-gray-500 hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-gray-400 text-xs mb-4 truncate">
          {props.noteTitle}
        </p>

        {/* Hint display (unlock mode) */}
        {!isSetMode && (props as UnlockProps).lockHint && (
          <div className="mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 text-xs">
              Hint: {(props as UnlockProps).lockHint}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {/* Password */}
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  if (isSetMode) { handleSetLock(); } else { handleUnlock(); }
                }
              }}
              placeholder={isSetMode ? 'Set a password' : 'Enter password'}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Confirm password (set mode only) */}
          {isSetMode && (
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          )}

          {/* Hint input (set mode only) */}
          {isSetMode && (
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Password hint (optional)"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
            />
          )}
        </div>

        {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button
            onClick={isSetMode ? handleSetLock : handleUnlock}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isSetMode ? 'Lock Note' : 'Unlock'}
          </button>

          {/* Remove lock button (unlock mode only) */}
          {!isSetMode && (
            <button
              onClick={handleRemoveLock}
              disabled={loading}
              className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-red-400 text-xs transition-colors disabled:opacity-60"
            >
              Remove lock permanently
            </button>
          )}

          <button
            onClick={props.onCancel}
            className="w-full py-2 rounded-xl text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
