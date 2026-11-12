'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, X, Send, Loader2, Database, ShieldCheck, Minimize2, Maximize2,
  TrendingUp, Package, Users, BarChart3, Sparkles, RefreshCw,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  { icon: Users, label: 'Jumlah User', query: 'Berapa jumlah total user dan distribusinya per role?' },
  { icon: TrendingUp, label: 'Omset Hari Ini', query: 'Berapa omset dan jumlah transaksi hari ini?' },
  { icon: Package, label: 'Stok Kritis', query: 'Bahan baku apa yang stoknya di bawah minimum?' },
  { icon: Sparkles, label: 'Alur Order', query: 'Bagaimana alur pemesanan dari pelanggan hingga barista di website ini?' },
  { icon: ShieldCheck, label: 'Hak Akses Role', query: 'Jelaskan role yang ada di website ini dan masing-masing hak aksesnya' },
  { icon: Bot, label: 'Model AI Barista', query: 'Bagaimana cara kerja dan pengaturan model AI Barista di website ini?' },
  { icon: BarChart3, label: 'Ringkasan DB', query: 'Tampilkan ringkasan lengkap seluruh database' },
  { icon: Sparkles, label: 'Voucher & Promo', query: 'Voucher dan promo apa yang masih aktif?' },
  { icon: Database, label: 'Status Sistem', query: 'Tampilkan status sistem, audit log, dan notifikasi terbaru' },
];

export default function AdminAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        '🤖 **Admin AI Assistant aktif!**\n\nSaya terhubung langsung ke **seluruh database** Kopi Mahasiswa dan siap menjawab pertanyaan manajemen:\n\n- 👥 Jumlah & distribusi user/pelanggan\n- 💰 Omset, transaksi, & pendapatan\n- 📦 Status stok & bahan baku kritis\n- 🍽️ Katalog produk & kategori\n- 🎟️ Voucher & promosi aktif\n- 🔧 Audit log & status sistem\n\nSilakan tanyakan apa saja! 👆',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/ai/admin-chat', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      const reply = data.reply || '⚠️ Admin AI tidak dapat memproses permintaan. Coba lagi.';

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      if (isMinimized || !isOpen) {
        setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Koneksi ke server terputus. Pastikan server berjalan dan coba lagi.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '🔄 Chat di-reset. Ada yang bisa saya bantu analisa dari database?',
      },
    ]);
  };

  return (
    <>
      {/* --- Floating Action Button (FAB) --- */}
      <button
        id="admin-ai-fab"
        onClick={() => {
          if (isOpen && !isMinimized) {
            setIsOpen(false);
          } else {
            setIsOpen(true);
            setIsMinimized(false);
            setHasUnread(false);
          }
        }}
        className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group hover:scale-110 active:scale-95 focus:outline-hidden ${
          isOpen && !isMinimized
            ? 'bg-slate-800 text-violet-300 border-2 border-violet-500 shadow-violet-500/20'
            : 'bg-gradient-to-tr from-violet-600 via-violet-500 to-indigo-600 text-white border-2 border-violet-400/50 shadow-violet-600/40 hover:shadow-violet-500/60'
        }`}
        title={isOpen && !isMinimized ? 'Tutup Admin AI' : 'Buka Admin AI Assistant'}
        aria-label="Admin AI Assistant FAB"
      >
        {isOpen && !isMinimized ? (
          <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
        ) : (
          <>
            <Bot className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-2 right-2 animate-bounce" />
          </>
        )}

        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse flex items-center justify-center text-[10px] font-bold text-slate-950">
            !
          </span>
        )}
      </button>

      {/* --- Chat Panel --- */}
      {isOpen && (
        <div
          id="admin-ai-chat-window"
          className={`fixed z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden border transition-all duration-300 ${
            isMinimized
              ? 'bottom-20 right-4 sm:bottom-24 sm:right-6 w-72 h-14'
              : 'bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:w-[420px] h-[550px] max-h-[85vh]'
          } bg-slate-900 border-slate-700`}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {/* Header: flex-none */}
          <div className="flex-none flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-900 via-slate-900 to-slate-900 border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-none">Admin AI Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-300 font-medium">Live DB Connected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reset Chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isMinimized ? 'Perbesar' : 'Perkecil'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* DB Status Strip: flex-none */}
              <div className="flex-none px-4 py-1.5 bg-slate-800/80 border-b border-slate-700/50 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] text-slate-400 font-medium">
                  Akses Admin — Data real-time database terhubung
                </span>
              </div>

              {/* Message Body (Riwayat Chat): flex-1 overflow-y-auto */}
              <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3 bg-slate-950/50">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-violet-700/80 border border-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-violet-200" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-tr-sm font-medium'
                          : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <MarkdownRenderer
                          content={msg.content}
                          variant="admin"
                          className="max-w-none text-slate-100"
                        />
                      ) : (
                        <div className="whitespace-pre-line font-medium text-white">
                          {msg.content}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                    <div className="w-7 h-7 rounded-lg bg-violet-700/80 border border-violet-600 flex items-center justify-center shrink-0">
                      <Loader2 className="w-3.5 h-3.5 text-violet-200 animate-spin" />
                    </div>
                    <span className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 animate-pulse">
                      Menganalisis database...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Footer (Suggestion Chips + Input Box): flex-none p-4 bg-transparent */}
              <div className="flex-none p-4 bg-transparent border-t border-slate-700/80 flex flex-col gap-2.5">
                {/* Quick Prompt Chips */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(p.query)}
                      disabled={isLoading}
                      className="flex items-center gap-1 whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-violet-500 transition-colors shrink-0 disabled:opacity-50"
                    >
                      <p.icon className="w-3 h-3 text-violet-400" />
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Input Box Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tanya tentang user, stok, omset, voucher..."
                    className="flex-1 bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 shadow-md shrink-0"
                    title="Kirim"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
