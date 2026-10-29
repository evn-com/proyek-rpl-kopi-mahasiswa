'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, RefreshCw, MessageSquare, ArrowRight, FlaskConical, Coffee, Database } from 'lucide-react';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

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

export default function HomeChatbotSection() {
  const [mode, setMode] = useState<'barista' | 'research'>('barista');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        'Halo Sobat Kopi Mahasiswa! ☕✨\n\nSaya **Barista & Assistant Pintar Kopi Mahasiswa**. Saya terhubung langsung ke database toko untuk memberikan informasi real-time mengenai **ketersediaan meja belajar**, **rekomendasi menu sesuai budget/rasa**, **menu begadang nugas**, dan **promo aktif 2026**. Mau tanya apa hari ini?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleModeChange = (newMode: 'barista' | 'research') => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode === 'research') {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '🔬 **Mode Riset Kopi Mahasiswa Aktif!**\n\nSelamat datang di laboratorium analisis sains kopi. Saya siap memberikan laporan riset komprehensif seputar kadar kafein, keasaman (pH) ramah maag, origin biji kopi, sains ekstraksi, dan tren konsumsi mahasiswa.',
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '☕ **Mode Barista & Assistant Pintar Aktif!**\n\nDatabase menu, meja, dan promo aktif 2026 siap saya akseskan untukmu. Mau tanya racikan menu favoritmu atau info ketersediaan meja?',
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: updatedMessages, mode }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Maaf, barista AI sedang meracik pesanan lain. Coba tanyakan lagi ya!',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Terjadi sedikit gangguan koneksi. Tapi jangan khawatir, kamu bisa melihat seluruh pilihan menu di halaman Menu kami!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          mode === 'research'
            ? '🔬 **Mode Riset Kopi Mahasiswa Aktif!** Tanyakan riset kadar kafein, keasaman (pH), profil roasting, atau tren pasar nugas mahasiswa.'
            : 'Halo Sobat Kopi Mahasiswa! ☕✨ Saya **Barista & Assistant Pintar Kopi Mahasiswa**. Tanyakan racikan menu terfavorit, ketersediaan meja, atau promo aktif 2026!',
      },
    ]);
  };

  const currentStarters = mode === 'research' ? RESEARCH_STARTERS : BARISTA_STARTERS;

  return (
    <section className="mt-10 rounded-3xl bg-gradient-to-b from-coffee-950 via-coffee-900 to-coffee-950 dark:from-black dark:via-espresso-card dark:to-espresso-deep border border-amber-500/30 dark:border-espresso-border shadow-2xl overflow-hidden text-cream relative">
      {/* Background glow effects */}
      <div className={`absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${mode === 'research' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`} />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-coffee-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-black/40 backdrop-blur-md border-b border-coffee-800 dark:border-espresso-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg shrink-0 transition-all ${mode === 'research' ? 'bg-gradient-to-tr from-emerald-500 to-teal-300 text-coffee-950' : 'bg-gradient-to-tr from-amber-500 to-amber-300 text-coffee-950'}`}>
            {mode === 'research' ? (
              <FlaskConical className="w-6 h-6 animate-bounce text-coffee-950" />
            ) : (
              <Sparkles className="w-6 h-6 animate-pulse text-coffee-950" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>{mode === 'research' ? 'Asisten Peneliti & Analis Kopi' : 'Barista & Assistant Pintar'}</span>
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${mode === 'research' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live DB Connected
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {mode === 'research'
                ? 'Analisis laboratorium sains kopi, kadar kafein, keasaman pH, & tren pasar'
                : 'Rekomendasi menu budget, menu begadang skripsi, status meja real-time & promo 2026'}
            </p>
          </div>
        </div>

        {/* Action controls: Mode switcher & Reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-coffee-900/80 dark:bg-black/60 p-1 rounded-xl border border-coffee-700/80 dark:border-espresso-border flex items-center gap-1">
            <button
              onClick={() => handleModeChange('barista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'barista'
                  ? 'bg-amber-500 text-coffee-950 shadow-md'
                  : 'text-coffee-300 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Barista</span>
            </button>
            <button
              onClick={() => handleModeChange('research')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'research'
                  ? 'bg-emerald-500 text-coffee-950 shadow-md'
                  : 'text-coffee-300 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Riset</span>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200 hover:text-white transition-colors flex items-center gap-1 text-xs shrink-0"
            title="Reset Percakapan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="p-4 sm:p-6 h-[380px] overflow-y-auto space-y-4 bg-black/20 scrollbar-thin scrollbar-thumb-coffee-800">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${mode === 'research' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'}`}>
                {mode === 'research' ? <FlaskConical className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950 font-medium rounded-tr-xs'
                  : 'bg-coffee-900/90 dark:bg-espresso-card border border-coffee-700/80 dark:border-espresso-border text-cream rounded-tl-xs backdrop-blur-xs'
              }`}
            >
              {m.role === 'assistant' ? (
                <MarkdownRenderer
                  content={m.content}
                  variant="dark"
                  className="max-w-none text-cream"
                />
              ) : (
                <div className="whitespace-pre-line font-medium text-coffee-950">
                  {m.content}
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-coffee-950 flex items-center justify-center shrink-0 shadow-sm font-bold mt-0.5">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-amber-300 text-xs bg-coffee-900/80 dark:bg-espresso-card p-3 rounded-2xl w-fit border border-amber-500/30 dark:border-espresso-border shadow-md animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>
              {mode === 'research'
                ? 'Peneliti AI sedang menganalisis data laboratorium...'
                : 'Barista AI sedang memeriksa database toko & meracik rekomendasi...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      <div className="p-3 bg-black/40 border-t border-coffee-800 dark:border-espresso-border flex gap-2 overflow-x-auto no-scrollbar">
        {currentStarters.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className={`text-xs whitespace-nowrap px-3.5 py-2 rounded-xl transition-all shrink-0 font-medium disabled:opacity-50 border ${
              mode === 'research'
                ? 'bg-emerald-950/80 hover:bg-emerald-500/20 hover:border-emerald-400/50 border-emerald-800/80 text-emerald-200'
                : 'bg-coffee-900/90 hover:bg-amber-500/20 hover:border-amber-400/50 border-coffee-700/70 text-amber-200'
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-black/60 border-t border-coffee-800 dark:border-espresso-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              mode === 'research'
                ? 'Ketik topik riset kafein, keasaman pH, profil roasting, atau tren pasar...'
                : 'Tanya rekomendasi menu budget, meja kosong, begadang skripsi, promo 2026...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl bg-coffee-900/90 dark:bg-espresso-card border border-coffee-700 dark:border-espresso-border text-cream placeholder-coffee-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`px-5 py-3 rounded-2xl font-bold hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 ${
              mode === 'research'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-coffee-950'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950'
            }`}
          >
            <span>Kirim</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-[11px] text-coffee-400">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Terhubung real-time ke database Menu, Meja & Promo 2026 Kopi Mahasiswa</span>
          </span>
          <Link
            href="/menu"
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Lihat Semua Menu</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
