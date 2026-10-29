'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, User, Bot, UserCheck, Send, RefreshCw,
  Phone, Clock, ShieldAlert, Sparkles, CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'customer' | 'bot' | 'staff';
  text: string;
  timestamp: string;
  staffName?: string;
}

interface ConversationSession {
  phone: string;
  customerName: string;
  status: 'BOT_ACTIVE' | 'HUMAN_ACTIVE';
  takenOverBy: string | null;
  takenOverAt: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ChatMessage[];
}

interface AdminWhatsAppInboxProps {
  onShowToast: (text: string, type?: 'success' | 'error') => void;
}

export default function AdminWhatsAppInbox({ onShowToast }: AdminWhatsAppInboxProps) {
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ConversationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BOT_ACTIVE' | 'HUMAN_ACTIVE'>('ALL');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp/conversations');
      if (!res.ok) throw new Error('Gagal memuat percakapan');
      const data = await res.json();
      const list: ConversationSession[] = data.conversations || [];
      setConversations(list);

      // Auto-select first conversation if none selected
      if (!selectedPhone && list.length > 0) {
        setSelectedPhone(list[0].phone);
      }
    } catch (err: any) {
      if (!silent) onShowToast(err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchActiveConversation = async (phone: string) => {
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations?phone=${phone}`);
      if (!res.ok) throw new Error('Gagal memuat percakapan');
      const data = await res.json();
      setActiveSession(data.conversation || null);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedPhone) {
        fetchActiveConversation(selectedPhone);
      }
    }, 5000); // Polling update setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      fetchActiveConversation(selectedPhone);
    }
  }, [selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleToggleHandover = async (newStatus: 'BOT_ACTIVE' | 'HUMAN_ACTIVE') => {
    if (!selectedPhone) return;
    try {
      const res = await fetch('/api/admin/whatsapp/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onShowToast(
        newStatus === 'HUMAN_ACTIVE'
          ? 'Percakapan berhasil diambil alih! AI dinonaktifkan untuk pelanggan ini.'
          : 'Kontrol berhasil dikembalikan ke Bot AI.'
      );

      fetchActiveConversation(selectedPhone);
      fetchConversations(true);
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhone || !inputText.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone, message: inputText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInputText('');
      onShowToast('Pesan WhatsApp berhasil dikirim');
      fetchActiveConversation(selectedPhone);
      fetchConversations(true);
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchSearch =
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>WhatsApp Live Chat &amp; Human Handover</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pantau chat pelanggan via WhatsApp, ambil alih kendali percakapan dari AI (*Handover*), dan kirim balasan langsung.
          </p>
        </div>
        <button
          onClick={() => fetchConversations()}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Inbox</span>
        </button>
      </div>

      {/* Main Chat Layout (Split Pane) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[720px]">
        {/* Left Pane: Conversations List (5 cols) */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/60">
          {/* Search & Filter Bar */}
          <div className="p-3.5 border-b border-slate-800 space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor atau nama pelanggan..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
            <div className="flex items-center gap-1.5 text-[11px]">
              {(['ALL', 'BOT_ACTIVE', 'HUMAN_ACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st === 'BOT_ACTIVE' ? '🤖 Bot' : '👤 Staf'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {conversations.length === 0
                  ? 'Belum ada pesan WhatsApp yang masuk dari webhook.'
                  : 'Tidak ada percakapan yang cocok dengan filter.'}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedPhone === c.phone;
                return (
                  <button
                    key={c.phone}
                    onClick={() => setSelectedPhone(c.phone)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-4 border-amber-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-sm">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-white truncate">
                          {c.customerName}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {new Date(c.lastMessageAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mb-1">
                        {c.lastMessage || 'Belum ada pesan'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            c.status === 'BOT_ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {c.status === 'BOT_ACTIVE' ? '🤖 BOT_ACTIVE' : '👤 HUMAN_ACTIVE'}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950">
                            {c.unreadCount} baru
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window (7 cols) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-slate-900/80">
          {activeSession ? (
            <>
              {/* Top Chat Header with Handover Controls */}
              <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight">
                      {activeSession.customerName}
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400">
                      +{activeSession.phone}
                    </span>
                  </div>
                </div>

                {/* Handover Control Buttons */}
                <div className="flex items-center gap-2">
                  {activeSession.status === 'BOT_ACTIVE' ? (
                    <button
                      onClick={() => handleToggleHandover('HUMAN_ACTIVE')}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                      title="Alihkan kendali dari AI ke staf agar bot berhenti membalas otomatis"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ambil Alih Percakapan</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleHandover('BOT_ACTIVE')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                      title="Kembalikan kendali percakapan ke AI Barista"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Kembalikan ke Bot</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between border-b ${
                  activeSession.status === 'BOT_ACTIVE'
                    ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeSession.status === 'BOT_ACTIVE' ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Status: <strong>BOT_ACTIVE</strong> — AI aktif membalas pertanyaan pelanggan secara otomatis.</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Status: <strong>HUMAN_ACTIVE</strong> — Diambil alih oleh {activeSession.takenOverBy || 'Staf'}. Balasan otomatis AI dihentikan.</span>
                    </>
                  )}
                </div>
                {activeSession.takenOverAt && (
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    Sejak {new Date(activeSession.takenOverAt).toLocaleTimeString('id-ID')}
                  </span>
                )}
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[500px]">
                {activeSession.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    <span>Belum ada riwayat pesan untuk percakapan ini.</span>
                  </div>
                ) : (
                  activeSession.messages.map((msg) => {
                    const isCust = msg.sender === 'customer';
                    const isBot = msg.sender === 'bot';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCust ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md whitespace-pre-wrap leading-relaxed ${
                            isCust
                              ? 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700'
                              : isBot
                              ? 'bg-violet-950/70 text-violet-100 border border-violet-700/50 rounded-tr-xs'
                              : 'bg-amber-500/20 text-amber-100 border border-amber-500/50 rounded-tr-xs'
                          }`}
                        >
                          {/* Sender badge header */}
                          <div className="flex items-center gap-1.5 mb-1 font-bold text-[10px]">
                            {isCust ? (
                              <span className="text-slate-400">Pelanggan</span>
                            ) : isBot ? (
                              <span className="text-violet-300 flex items-center gap-1">
                                <Bot className="w-3 h-3" /> AI Barista
                              </span>
                            ) : (
                              <span className="text-amber-300 flex items-center gap-1">
                                <UserCheck className="w-3 h-3" /> Staf ({msg.staffName || 'Admin'})
                              </span>
                            )}
                          </div>
                          <div>{msg.text}</div>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 font-mono px-1">
                          {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Send Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeSession.status === 'HUMAN_ACTIVE'
                      ? 'Ketik balasan Anda sebagai staf...'
                      : 'Ketik pesan manual (catatan: bot saat ini aktif)...'
                  }
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                >
                  <Send className={`w-3.5 h-3.5 ${sending ? 'animate-pulse' : ''}`} />
                  <span>{sending ? 'Mengirim...' : 'Kirim'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
              <Phone className="w-10 h-10 mb-3 opacity-30 text-amber-400" />
              <span className="font-semibold text-white mb-1">Pilih Percakapan</span>
              <span>Pilih salah satu nomor pelanggan di panel kiri untuk melihat riwayat chat dan mengelola handover.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
