'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Trash2, FileText, Loader2, Share2, Eye, Mic, MicOff } from 'lucide-react';
import { Note, Theme } from '../page';
import ShareModal from './ShareModal';
import { SHARED_GROQ_API_KEY } from '@/lib/config';

interface EditorProps {
  note: Note | null;
  theme: Theme;
  readOnly?: boolean;
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onDelete: (id: string) => void;
  onShare?: (noteId: string) => void;
}

// Sanitize note title for use as a filename
function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_') || 'note';
}

// Format note as plain text for download
function formatNoteAsTxt(title: string, content: string): string {
  return `${title}\n${'='.repeat(Math.max(title.length, 11))}\n${content}`;
}

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

function playBeep(type: 'start' | 'stop') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // start: rising tone (800Hz), stop: falling tone (400Hz)
    osc.frequency.value = type === 'start' ? 800 : 400;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    // Audio not supported — silent fail
  }
}

export default function Editor({ note, theme, readOnly, onUpdate, onDelete, onShare }: EditorProps) {
  const isDark = theme === 'dark';

  // ── Share modal state ─────────────────────────────────────────────────────────
  const [showShareModal, setShowShareModal] = useState(false);

  // ── Speech-to-text state ─────────────────────────────────────────────────────
  const [speechState, setSpeechState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const noteContentRef = useRef<string>('');
  // Always-fresh refs so async handlers never use stale closures
  const onUpdateRef = useRef(onUpdate);
  const noteIdRef = useRef(note?.id ?? '');
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { noteIdRef.current = note?.id ?? ''; }, [note?.id]);

  // Stop mic stream on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Autocomplete state ───────────────────────────────────────────────────────
  const [suggestion, setSuggestion] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef('');

  // ── Save as TXT ──────────────────────────────────────────────────────────────
  const handleSaveAsTxt = useCallback(() => {
    if (!note) return;
    const text = formatNoteAsTxt(note.title || 'Untitled Note', note.content);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(note.title || 'note')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [note]);

  // ── Speech-to-text handler (MediaRecorder + Groq Whisper) ───────────────────
  const toggleSpeech = useCallback(async () => {
    if (speechState === 'processing') return;

    // Stop recording → triggers onstop which sends audio to Whisper
    if (speechState === 'listening') {
      playBeep('stop');
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!noteIdRef.current) return;

    const apiKey = SHARED_GROQ_API_KEY;

    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Microphone access is not supported in this browser.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert('Microphone access denied. Please allow microphone access in your browser.');
      return;
    }

    streamRef.current = stream;
    audioChunksRef.current = [];
    const baseContent = noteContentRef.current;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      const chunks = audioChunksRef.current;
      if (chunks.length === 0) {
        setSpeechState('idle');
        return;
      }

      setSpeechState('processing');
      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';

      const formData = new FormData();
      formData.append('file', blob, `audio.${ext}`);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');

      try {
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
        });
        const data = await res.json();
        const text = (data?.text ?? '').trim();
        if (text) {
          const sep = baseContent && !baseContent.endsWith(' ') && !baseContent.endsWith('\n') ? ' ' : '';
          onUpdateRef.current(noteIdRef.current, { content: baseContent + sep + text });
        }
      } catch {
        alert('Failed to transcribe audio. Please check your Groq API key and try again.');
      } finally {
        setSpeechState('idle');
      }
    };

    playBeep('start');
    recorder.start();
    setSpeechState('listening');
  }, [speechState]);

  // Global keyboard shortcut: Ctrl+Shift+V to toggle speech
  useEffect(() => {
    if (readOnly) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        toggleSpeech();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, toggleSpeech]);

  // ── Autocomplete helpers ─────────────────────────────────────────────────────
  const tryLocalMath = (text: string): number | null => {
    try {
      const expr = text.replace(/=/g, '').replace(/x/gi, '*').trim();
      // eslint-disable-next-line no-new-func
      const result = new Function('"use strict"; return (' + expr + ')')();
      if (typeof result === 'number' && isFinite(result)) return result;
    } catch {
      // not valid math
    }
    return null;
  };

  const getSuggestion = useCallback(async (text: string) => {
    if (!text.trim() || text === lastTextRef.current) return;
    lastTextRef.current = text;

    const apiKey = SHARED_GROQ_API_KEY;

    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1].trim();
    if (lastLine.length < 3) {
      setSuggestion('');
      return;
    }

    const mathPattern = /[\d\s+\-*/^()x]+\s*=\s*$/;
    if (mathPattern.test(lastLine)) {
      const mathResult = tryLocalMath(lastLine);
      if (mathResult !== null) {
        setSuggestion(String(mathResult));
        return;
      }
    }

    const questionPattern =
      /^(what|how|why|when|where|who|which|can|is|are|does|do|define|explain)\b/i;
    const isQuestion = questionPattern.test(lastLine) || lastLine.endsWith('?');

    let prompt = '';
    if (isQuestion) {
      prompt = `Answer this question in ONE short sentence (max 15 words): "${lastLine}"`;
    } else if (mathPattern.test(lastLine)) {
      prompt = `What is the result of: ${lastLine} Answer with just the number or expression.`;
    } else {
      prompt = `Complete this text with the next 5-8 words only. Text: "${lastLine}" Continue naturally:`;
    }

    try {
      setIsLoadingSuggestion(true);
      const res = await fetch(GROQ_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 30,
        }),
      });
      const data = await res.json();
      const result = data?.choices?.[0]?.message?.content?.trim() ?? '';
      if (text === lastTextRef.current) {
        setSuggestion(result);
      }
    } catch {
      setSuggestion('');
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, []);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!note || readOnly) return;
      const newContent = e.target.value;
      onUpdate(note.id, { content: newContent });
      setSuggestion('');
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = setTimeout(() => {
        getSuggestion(newContent);
      }, 800);
    },
    [note, onUpdate, getSuggestion, readOnly]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent browser's native Save dialog; actual save handled in page.tsx
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return;
      }
      if (readOnly) return;
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        const current = note?.content ?? '';
        const newContent = current + suggestion + ' ';
        onUpdate(note!.id, { content: newContent });
        setSuggestion('');
        lastTextRef.current = newContent;
        return;
      }
      if (e.key === 'Escape') {
        setSuggestion('');
        return;
      }
      if (e.key !== 'Tab' && e.key !== 'Escape') {
        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
      }
    },
    [suggestion, note, onUpdate, readOnly]
  );

  // Keep noteContentRef in sync so the speech onresult closure never reads stale content
  useEffect(() => {
    noteContentRef.current = note?.content ?? '';
  }, [note?.content]);

  // Clear suggestion when switching notes
  useEffect(() => {
    setSuggestion('');
    lastTextRef.current = '';
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
  }, [note?.id]);

  // ── Style helpers ────────────────────────────────────────────────────────────
  const panelBg = isDark
    ? 'bg-gradient-to-b from-[#0f0f1a] to-[#0c0c18]'
    : 'bg-white';

  const titleStyle = isDark
    ? 'bg-transparent text-slate-100 placeholder-slate-600 border-b border-white/5'
    : 'bg-transparent text-slate-800 placeholder-slate-400 border-b border-slate-200';

  const contentStyle = isDark
    ? 'bg-transparent text-slate-300 placeholder-slate-600 resize-none'
    : 'bg-transparent text-slate-700 placeholder-slate-400 resize-none';

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!note) {
    return (
      <div className={`h-full flex flex-col items-center justify-center ${panelBg}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20">
            <FileText size={32} className="text-violet-400" />
          </div>
          <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No note selected
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Create a new note or select one from the sidebar
          </p>
        </div>
      </div>
    );
  }

  // ── Main editor ──────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-full ${panelBg}`}>
      {/* Toolbar */}
      <div
        className={`flex items-center justify-between px-6 py-3 flex-shrink-0 border-b ${
          isDark ? 'border-white/5' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {note.content.split(/\s+/).filter(Boolean).length} words &bull;{' '}
            {note.content.length} chars
          </span>
          {readOnly && (
            <span
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                isDark
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-amber-50 border border-amber-200 text-amber-600'
              }`}
            >
              <Eye size={12} />
              Read only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mic / Speech-to-text — only for editable notes */}
          {!readOnly && (
            <button
              onClick={toggleSpeech}
              title={
                speechState === 'listening'
                  ? 'Stop listening (Ctrl+Shift+V)'
                  : speechState === 'processing'
                  ? 'Processing speech...'
                  : 'Speech to text (Ctrl+Shift+V)'
              }
              aria-label={
                speechState === 'listening'
                  ? 'Stop listening (Ctrl+Shift+V)'
                  : speechState === 'processing'
                  ? 'Processing speech...'
                  : 'Speech to text (Ctrl+Shift+V)'
              }
              disabled={speechState === 'processing'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                speechState === 'listening'
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse'
                  : speechState === 'processing'
                  ? isDark
                    ? 'bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                  : isDark
                  ? 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              {speechState === 'processing' ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span className="hidden sm:inline ml-1">Transcribing...</span>
                </>
              ) : speechState === 'listening' ? (
                <>
                  <MicOff size={13} />
                  <span className="hidden sm:inline ml-1">Stop</span>
                </>
              ) : (
                <Mic size={13} />
              )}
            </button>
          )}

          {/* Save as TXT */}
          <button
            onClick={handleSaveAsTxt}
            aria-label="Save note as text file"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Download size={13} />
            <span className="hidden sm:inline ml-1">Save .txt</span>
          </button>

          {/* Share — only shown for own notes */}
          {onShare && !readOnly && (
            <button
              onClick={() => setShowShareModal(true)}
              aria-label="Share this note"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Share2 size={13} />
              <span className="hidden sm:inline ml-1">Share</span>
            </button>
          )}

          {/* Delete — hidden for shared notes */}
          {!readOnly && (
            <button
              onClick={() => onDelete(note.id)}
              aria-label="Delete this note"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline ml-1">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        <input
          type="text"
          value={note.title}
          onChange={(e) => !readOnly && onUpdate(note.id, { title: e.target.value })}
          readOnly={readOnly}
          placeholder="Note title..."
          className={`w-full text-2xl font-bold pb-3 ${titleStyle} focus:outline-none ${readOnly ? 'cursor-default' : ''}`}
        />
      </div>

      {/* Content — ghost text overlay */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Ghost text layer — rendered behind the textarea */}
          {!readOnly && (
            <div
              aria-hidden="true"
              className={`absolute inset-0 text-base leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none`}
              style={{ color: 'transparent' }}
            >
              {note.content}
              <span
                style={{
                  color: isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.5)',
                }}
              >
                {suggestion}
              </span>
            </div>
          )}

          {/* Actual textarea — transparent so ghost text shows through */}
          <textarea
            value={note.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            placeholder={readOnly ? '' : 'Start writing your note...'}
            className={`absolute inset-0 w-full h-full text-base leading-relaxed ${contentStyle} bg-transparent focus:outline-none ${readOnly ? 'cursor-default' : ''}`}
            style={{ caretColor: isDark ? 'white' : 'black' }}
          />

          {/* Tab / Esc hint badge */}
          {!readOnly && suggestion && (
            <div className="absolute bottom-2 right-3 flex items-center gap-1 text-xs pointer-events-none z-10">
              <kbd
                className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}
              >
                Tab
              </kbd>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>to accept</span>
              <kbd
                className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}
              >
                Esc
              </kbd>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>to dismiss</span>
            </div>
          )}

          {/* Speech recording indicator */}
          {!readOnly && speechState === 'listening' && (
            <div
              aria-live="polite"
              className={`absolute bottom-10 left-0 right-0 px-2 py-1 text-sm italic pointer-events-none z-10 ${
                isDark ? 'text-red-400/70' : 'text-red-500/70'
              }`}
            >
              Recording... press Ctrl+Shift+V or click Stop to transcribe.
            </div>
          )}

          {/* Loading indicator for suggestion */}
          {!readOnly && isLoadingSuggestion && !suggestion && (
            <div className="absolute bottom-2 right-3 pointer-events-none z-10">
              <Loader2
                size={12}
                className={`animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          noteId={note.id}
          theme={theme}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
