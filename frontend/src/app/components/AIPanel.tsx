'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  Languages,
  MessageSquare,
  Copy,
  Check,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { Note, Theme } from '../page';
import { SHARED_GROQ_API_KEY } from '@/lib/config';

interface AIPanelProps {
  note: Note | null;
  apiKey: string;
  theme: Theme;
  onApplyResult: (result: string, mode: 'replace' | 'append') => void;
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type AIResultMode = 'replace' | 'append';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_MAIN = 'llama-3.3-70b-versatile';
const MODEL_FAST = 'llama-3.1-8b-instant';

const QUICK_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: '📝', prompt: 'Summarize this note as bullet points:', mode: 'append' as AIResultMode },
  { id: 'expand', label: 'Expand', icon: '📖', prompt: 'Expand this note into detailed paragraphs:', mode: 'append' as AIResultMode },
  { id: 'grammar', label: 'Fix Grammar', icon: '✏️', prompt: 'Fix grammar and spelling in this text, return only the corrected text:', mode: 'replace' as AIResultMode, model: MODEL_FAST },
  { id: 'keypoints', label: 'Key Points', icon: '🔑', prompt: 'Extract numbered key points and action items from this note:', mode: 'append' as AIResultMode },
  { id: 'eli5', label: 'ELI5', icon: '🧒', prompt: 'Explain this note in simple terms that anyone can understand:', mode: 'append' as AIResultMode },
];

const REWRITE_OPTIONS = [
  { id: 'professional', label: 'Professional', prompt: 'Rewrite this note in a professional tone:' },
  { id: 'casual', label: 'Casual', prompt: 'Rewrite this note in a casual, friendly tone:' },
  { id: 'academic', label: 'Academic', prompt: 'Rewrite this note in an academic tone:' },
  { id: 'persuasive', label: 'Persuasive', prompt: 'Rewrite this note in a persuasive tone:' },
  { id: 'creative', label: 'Creative', prompt: 'Rewrite this note in a creative, engaging style:' },
];

const TRANSLATE_OPTIONS = [
  { id: 'spanish', label: 'Spanish', prompt: 'Translate this note to Spanish:' },
  { id: 'french', label: 'French', prompt: 'Translate this note to French:' },
  { id: 'german', label: 'German', prompt: 'Translate this note to German:' },
  { id: 'japanese', label: 'Japanese', prompt: 'Translate this note to Japanese:' },
  { id: 'chinese', label: 'Chinese', prompt: 'Translate this note to Chinese (Simplified):' },
  { id: 'arabic', label: 'Arabic', prompt: 'Translate this note to Arabic:' },
  { id: 'tamil', label: 'Tamil', prompt: 'Translate this note to Tamil:' },
];

async function callGroq(apiKey: string, messages: { role: string; content: string }[], model = MODEL_MAIN): Promise<string> {
  const res = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 2048, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `API error ${res.status}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}


export default function AIPanel({ note, apiKey, theme, onApplyResult, onUpdate: _onUpdate }: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiMode, setAiMode] = useState<AIResultMode>('append');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showRewrite, setShowRewrite] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const panelBg = isDark
    ? 'bg-gradient-to-b from-[#13132b] to-[#0f0f22] border-l border-white/5'
    : 'bg-gradient-to-b from-white to-slate-50 border-l border-slate-200';

  const textPrimary = isDark ? 'text-slate-200' : 'text-slate-800';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-white/5 border border-white/8' : 'bg-slate-50 border border-slate-200';
  const inputBg = isDark
    ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 focus:border-violet-500/50'
    : 'bg-slate-100 border-slate-200 text-slate-700 placeholder-slate-400 focus:border-violet-400';

  const checkApiAndNote = (): string | null => {
    if (!note?.content?.trim()) { setError('The note is empty. Add some content first.'); return null; }
    setError('');
    return note.content;
  };

  const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
    const content = checkApiAndNote();
    if (!content) return;
    setLoading(true);
    setAiResult('');
    try {
      const result = await callGroq(
        SHARED_GROQ_API_KEY,
        [{ role: 'user', content: `${action.prompt}\n\n${content}` }],
        action.model ?? MODEL_MAIN
      );
      setAiResult(result);
      setAiMode(action.mode);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async (option: typeof REWRITE_OPTIONS[0]) => {
    const content = checkApiAndNote();
    if (!content) return;
    setLoading(true);
    setAiResult('');
    setShowRewrite(false);
    try {
      const result = await callGroq(SHARED_GROQ_API_KEY, [{ role: 'user', content: `${option.prompt}\n\n${content}` }]);
      setAiResult(result);
      setAiMode('replace');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (option: typeof TRANSLATE_OPTIONS[0]) => {
    const content = checkApiAndNote();
    if (!content) return;
    setLoading(true);
    setAiResult('');
    setShowTranslate(false);
    try {
      const result = await callGroq(SHARED_GROQ_API_KEY, [{ role: 'user', content: `${option.prompt}\n\n${content}` }]);
      setAiResult(result);
      setAiMode('append');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!aiResult) return;
    await navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!aiResult) return;
    onApplyResult(aiResult, aiMode);
    setAiResult('');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) {
      return;
    }
    setError('');
    const userMsg: Message = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const systemPrompt = note?.content
        ? `You are a helpful assistant. The user is working on a note. Here is the note content:\n\n---\nTitle: ${note.title}\n${note.content}\n---\n\nAnswer questions about this note or help the user improve it.`
        : 'You are a helpful assistant for note-taking.';

      const result = await callGroq(SHARED_GROQ_API_KEY, [
        { role: 'system', content: systemPrompt },
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ]);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: result }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${panelBg} overflow-y-auto`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex-shrink-0 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className={`font-semibold text-sm ${textPrimary}`}>AI Assistant</span>
          {loading && <Loader2 size={14} className="text-violet-400 animate-spin ml-auto" />}
        </div>
      </div>

      <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <X size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSecondary}`}>
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-white/5 border border-white/8 text-slate-300 hover:bg-violet-500/20 hover:border-violet-500/30 hover:text-violet-200'
                    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700'
                }`}
              >
                <span>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rewrite As */}
        <div>
          <button
            onClick={() => setShowRewrite((v) => !v)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Wand2 size={12} /> Rewrite As
            </span>
            {showRewrite ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showRewrite && (
            <div className="mt-1 grid grid-cols-2 gap-1">
              {REWRITE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleRewrite(opt)}
                  disabled={loading}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40 ${
                    isDark
                      ? 'bg-white/5 border border-white/8 text-slate-300 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-indigo-200'
                      : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Translate To */}
        <div>
          <button
            onClick={() => setShowTranslate((v) => !v)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Languages size={12} /> Translate To
            </span>
            {showTranslate ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showTranslate && (
            <div className="mt-1 grid grid-cols-2 gap-1">
              {TRANSLATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleTranslate(opt)}
                  disabled={loading}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40 ${
                    isDark
                      ? 'bg-white/5 border border-white/8 text-slate-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-200'
                      : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Result Box */}
        {(loading || aiResult) && (
          <div className={`rounded-xl border p-3 ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>
                AI Result
              </span>
              <div className="flex items-center gap-1">
                {aiResult && (
                  <>
                    <button
                      onClick={handleCopy}
                      className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'}`}
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={handleApply}
                      className="px-2 py-1 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium"
                    >
                      Apply
                    </button>
                  </>
                )}
                <button
                  onClick={() => setAiResult('')}
                  className={`p-1.5 rounded-md ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-red-400' : 'hover:bg-slate-200 text-slate-500 hover:text-red-500'}`}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2 size={16} className="text-violet-400 animate-spin" />
                <span className={`text-xs ${textSecondary}`}>Generating...</span>
              </div>
            ) : (
              <p className={`text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto ${textSecondary}`}>
                {aiResult}
              </p>
            )}
            {aiResult && (
              <p className={`text-xs mt-2 pt-2 border-t ${isDark ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                Apply will {aiMode === 'replace' ? 'replace' : 'append to'} note content
              </p>
            )}
          </div>
        )}

        {/* Chat with Note */}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${textSecondary}`}>
            <MessageSquare size={12} /> Chat with Note
          </p>
          <div className={`rounded-xl border ${cardBg} overflow-hidden`}>
            <div className="max-h-48 overflow-y-auto p-2 space-y-2">
              {chatMessages.length === 0 ? (
                <p className={`text-xs text-center py-4 ${textSecondary}`}>
                  Ask anything about your note...
                </p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                          : isDark
                            ? 'bg-white/8 text-slate-300'
                            : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className={`px-3 py-2 rounded-lg ${isDark ? 'bg-white/8' : 'bg-white border border-slate-200'}`}>
                    <Loader2 size={12} className="text-violet-400 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className={`flex items-center gap-2 p-2 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                placeholder="Ask AI..."
                className={`flex-1 px-2 py-1.5 rounded-lg border text-xs ${inputBg} transition-colors`}
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="p-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
