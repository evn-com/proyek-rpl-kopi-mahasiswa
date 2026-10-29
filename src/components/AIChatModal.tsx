'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Coffee,
  Bot,
  User,
  Loader2,
  FlaskConical,
  Database,
  Square,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useStreamingChat, ChatMessage } from '@/hooks/useStreamingChat';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

const BARISTA_STARTERS = [
  '💰 Rekomendasi hemat di bawah 20k',
  '⚡ Menu begadang & nugas skripsi',
  '🪑 Cek ketersediaan meja belajar',
  '🎟️ Info Promo Mahasiswa 2026',
  '🍃 Minuman bebas kafein / aman maag',
  '📍 Fasilitas toko, WiFi & jam buka',
];

const RESEARCH_STARTERS = [
  '🔬 Riset Kadar Kafein & Keasaman (pH)',
  '🌍 Riset Origin Biji & Roasting Profile',
  '📊 Riset Tren Pasar & Kantong Mahasiswa',
  '🧪 Riset Sains Ekstraksi & Ratio Espresso',
];

const INITIAL_BARISTA_MSG: ChatMessage = {
  role: 'assistant',
  content:
    'Halo Sobat Kopi Mahasiswa! ☕✨\n\nSaya **Barista & Assistant Pintar Kopi Mahasiswa** yang ditenagai oleh **Gemini 2.5 Flash** dan terhubung langsung ke database toko.\n\nAda yang bisa saya bantu hari ini? Kamu bisa cek **ketersediaan meja belajar**, **rekomendasi menu sesuai budget**, **menu nugas/begadang**, atau **promo aktif 2026**!',
};

export default function AIChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'barista' | 'research'>('barista');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    setMessages,
    input,
    setInput,
    isStreaming,
    error,
    charCount,
    isOverLimit,
    rateLimitCountdown,
    maxInputChars,
    sendMessage,
    stopStream,
    clearMessages,
    dismissError,
  } = useStreamingChat(mode, [INITIAL_BARISTA_MSG]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  // Handle escape key and click outside to close floating chat window
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('#ai-chat-window') &&
        !target.closest('#ai-chat-trigger-btn')
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  const handleModeChange = (newMode: 'barista' | 'research') => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode === 'research') {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '🔬 **Mode Riset Kopi Mahasiswa Aktif!**\n\nSelamat datang di laboratorium analisis sains kopi. Saya siap memberikan laporan riset mendalam seputar kadar kafein, keasaman (pH) ramah maag, origin biji kopi, sains ekstraksi, dan tren konsumsi mahasiswa.',
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '☕ **Mode Barista & Assistant Pintar Aktif!**\n\nDatabase menu, meja, dan promo aktif 2026 siap saya akseskan untukmu. Mau tanya apa hari ini?',
        },
      ]);
    }
  };

  if (!isOpen) return null;

  const currentStarters = mode === 'research' ? RESEARCH_STARTERS : BARISTA_STARTERS;

  return (
    <div
      id="ai-chat-window"
      className="fixed bottom-20 right-4 sm:right-6 z-50 w-[min(calc(100vw-2rem),380px)] sm:w-[420px] h-[550px] max-h-[85vh] rounded-3xl bg-cream dark:bg-espresso-deep border border-coffee-200/90 dark:border-espresso-border shadow-2xl overflow-hidden flex flex-col text-coffee-950 dark:text-cream transition-colors duration-200 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Header Bar: flex-none */}
      <div className="flex-none p-3 sm:p-3.5 bg-gradient-to-r from-coffee-950 via-coffee-900 to-coffee-950 dark:from-black dark:via-espresso-dark dark:to-coffee-950 text-white flex items-center justify-between shadow-md border-b border-coffee-800 dark:border-espresso-border">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 transition-transform ${
              mode === 'research'
                ? 'bg-emerald-400 text-coffee-950'
                : 'bg-gradient-to-tr from-amber-400 to-amber-500 text-coffee-950'
            }`}
          >
            {mode === 'research' ? (
              <FlaskConical className="w-4 h-4 text-coffee-950 animate-bounce" />
            ) : (
              <Bot className="w-4 h-4 text-coffee-950 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5 text-white">
              <span>{mode === 'research' ? 'Asisten Riset Kopi' : 'Barista & Assistant Pintar'}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Gemini
              </span>
            </h3>
            <p className="text-[10px] text-amber-200/90 flex items-center gap-1 mt-0.5">
              <Database className="w-2.5 h-2.5 text-amber-400" />
              <span>Live Database Toko</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-amber-100 flex items-center justify-center transition-colors"
            title="Bersihkan Percakapan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-amber-100 flex items-center justify-center transition-colors hover:text-white"
            title="Tutup Obrolan (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar: flex-none */}
      <div className="flex-none p-1.5 bg-coffee-900/90 dark:bg-black/50 border-b border-coffee-800/80 dark:border-espresso-border flex gap-1.5 justify-center shrink-0">
          <button
            onClick={() => handleModeChange('barista')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'barista'
                ? 'bg-amber-500 text-coffee-950 shadow-sm'
                : 'bg-coffee-950/50 text-coffee-300 hover:bg-coffee-800 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Mode Barista AI</span>
          </button>

          <button
            onClick={() => handleModeChange('research')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'research'
                ? 'bg-emerald-500 text-coffee-950 shadow-sm'
                : 'bg-coffee-950/50 text-coffee-300 hover:bg-coffee-800 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Mode Riset & Sains</span>
          </button>
        </div>

        {/* Rate Limiting / Validation Alert Banner: flex-none */}
        {error && (
          <div
            className={`flex-none px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b transition-colors ${
              error.type === 'rate_limit'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-red-500/15 border-red-500/30 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {error.type === 'rate_limit' ? (
                <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <span>{error.message}</span>
              {rateLimitCountdown > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold text-[10px]">
                  {rateLimitCountdown}s
                </span>
              )}
            </div>
            <button
              onClick={dismissError}
              className="p-1 hover:opacity-70 text-current"
              title="Tutup pesan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Container: flex-1 overflow-y-auto min-h-0 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3.5 bg-cream/70 dark:bg-espresso-deep/90">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    mode === 'research'
                      ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                      : 'bg-coffee-900 dark:bg-espresso-card text-amber-300 border border-coffee-700 dark:border-espresso-border'
                  }`}
                >
                  {mode === 'research' ? <FlaskConical className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-coffee-800 to-coffee-900 dark:from-amber-600 dark:to-amber-700 text-amber-100 dark:text-white rounded-tr-xs font-medium'
                    : 'bg-white dark:bg-espresso-card border border-coffee-200/80 dark:border-espresso-border text-coffee-950 dark:text-coffee-50 rounded-tl-xs'
                }`}
              >
                {m.role === 'assistant' ? (
                  <MarkdownRenderer
                    content={m.content}
                    isStreaming={m.isStreaming}
                    className="prose prose-sm dark:prose-invert max-w-none text-coffee-950 dark:text-coffee-50"
                  />
                ) : (
                  <div className="whitespace-pre-line font-medium">
                    {m.content}
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-coffee-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator when waiting for first token */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-center gap-2 text-coffee-700 dark:text-amber-300 text-xs italic bg-white/90 dark:bg-espresso-card p-3 rounded-2xl w-fit border border-coffee-200 dark:border-espresso-border shadow-xs animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
              <span>
                {mode === 'research'
                  ? 'Menghubungkan ke Gemini 2.5 Flash & menganalisis riset...'
                  : 'Barista AI sedang meracik jawaban secara real-time...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer (Suggestion Chips + Input Box): flex-none p-4 bg-transparent */}
        <div className="flex-none p-3 sm:p-4 bg-transparent border-t border-coffee-200/80 dark:border-espresso-border flex flex-col gap-2">
          {/* Quick Suggestion Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {currentStarters.map((prompt, i) => (
              <button
                key={i}
                type="button"
                disabled={isStreaming || rateLimitCountdown > 0}
                onClick={() => sendMessage(prompt)}
                className={`text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full border font-medium transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === 'research'
                    ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                    : 'bg-coffee-50 hover:bg-amber-100/70 border-coffee-200 text-coffee-900 dark:bg-espresso-deep dark:hover:bg-coffee-900/60 dark:border-espresso-border dark:text-amber-200'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar with Character Counter & Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                disabled={rateLimitCountdown > 0}
                placeholder={
                  rateLimitCountdown > 0
                    ? `Batas kirim tercapai. Tunggu ${rateLimitCountdown}s...`
                    : mode === 'research'
                    ? 'Tanyakan riset kafein, keasaman pH, profil roasting...'
                    : 'Tanya rekomendasi menu, ketersediaan meja, promo 2026...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={`flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-2xl bg-cream dark:bg-espresso-deep border text-coffee-950 dark:text-white placeholder-coffee-400 dark:placeholder-coffee-500 focus:outline-none transition-colors ${
                  isOverLimit
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-coffee-200 dark:border-espresso-border focus:border-amber-500 dark:focus:border-amber-400'
                }`}
              />

              {/* Stop Stream Button when streaming */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStream}
                  className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xs transition-all shrink-0"
                  title="Hentikan Streaming"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || isOverLimit || rateLimitCountdown > 0}
                  className={`w-8 h-8 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-xs transition-all shrink-0 ${
                    mode === 'research'
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      : 'bg-coffee-900 hover:bg-coffee-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-amber-200 dark:text-coffee-950'
                  }`}
                  title="Kirim Pesan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Character Counter & Helper row */}
            <div className="flex items-center justify-between px-1 text-[9px] text-coffee-500 dark:text-coffee-400">
              <span>
                {rateLimitCountdown > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    ⏳ Tunggu {rateLimitCountdown} detik
                  </span>
                ) : (
                  'Streaming Gemini 2.5 Flash'
                )}
              </span>
              <span
                className={`font-mono font-medium ${
                  isOverLimit
                    ? 'text-red-600 dark:text-red-400 font-bold'
                    : charCount > maxInputChars * 0.9
                    ? 'text-amber-600 dark:text-amber-400'
                    : ''
                }`}
              >
                {charCount}/{maxInputChars}
              </span>
            </div>
          </form>
        </div>
    </div>
  );
}

