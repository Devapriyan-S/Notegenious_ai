'use client';
import { useState } from 'react';
import { apiLogin, apiSignup, apiVerifyOtp } from '@/lib/api';
import type { ApiUser } from '@/lib/api';
import { Mail, Lock, Eye, EyeOff, Loader2, User, KeyRound } from 'lucide-react';

interface AuthModalProps {
  onClose: (user?: ApiUser) => void;
}

type Mode = 'signin' | 'signup' | 'otp';

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // OTP state
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleEmailAuth = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await apiSignup(email, password, fullName);
        setPendingEmail(result.email);
        setMode('otp');
        setMessage('A 6-digit verification code has been sent to your email.');
      } else {
        const user = await apiLogin(email, password);
        onClose(user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (
        msg.toLowerCase().includes('fetch') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('load failed')
      ) {
        setError(
          'Cannot connect to the server. Make sure the Python backend is running: ' +
          'cd backend && uvicorn main:app --reload --port 9000'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await apiVerifyOtp(pendingEmail, otpCode.trim());
      onClose(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      if (mode === 'otp') handleVerifyOtp();
      else handleEmailAuth();
    }
  };

  // ── OTP verification screen ────────────────────────────────────────────────
  if (mode === 'otp') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <KeyRound size={20} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Check your email</h1>
            <p className="text-gray-400 text-sm mt-1">We sent a 6-digit code to</p>
            <p className="text-purple-400 text-sm font-medium mt-0.5">{pendingEmail}</p>
          </div>

          <div className="space-y-4" onKeyDown={handleKeyDown}>
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                maxLength={6}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm tracking-widest text-center"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}
          {message && <p className="mt-3 text-green-400 text-xs">{message}</p>}

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otpCode.length < 6}
            className="w-full mt-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Verify Code
          </button>

          <div className="mt-5 text-center text-xs text-gray-500">
            <p>
              Wrong email?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setOtpCode('');
                  setError('');
                  setMessage('');
                }}
                className="text-purple-400 hover:text-purple-300"
              >
                Back to sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-bold text-lg">N</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">NoteGenius AI</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'signin'
              ? 'Sign in to access your notes'
              : 'Create your free account'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          {mode === 'signup' && (
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          )}
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}
        {message && <p className="mt-3 text-green-400 text-xs">{message}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading}
          className="w-full mt-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        {/* Toggle links */}
        <div className="mt-5 text-center text-xs text-gray-500 space-y-2">
          {mode === 'signin' && (
            <p>
              No account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-purple-400 hover:text-purple-300"
              >
                Sign up free
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-purple-400 hover:text-purple-300"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
