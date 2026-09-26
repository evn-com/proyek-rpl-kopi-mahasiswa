'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Coffee, Bot, User, Loader2 } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  '☕ Kopi creamy yang tidak terlalu manis',
  '💰 Rekomendasi menu hemat di bawah 20k',
  '🍃 Pilihan minuman non-kopi yang segar',
  '🥐 Camilan hangat buat teman nugas skripsi',
];

export default function AIChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        'Halo! Saya **Barista AI Kopi Mahasiswa** ☕✨. Saya siap membantu kamu memilih kopi atau minuman sesuai selera, tingkat manis, dan budget kantong mahasiswa. Mau minum apa hari ini?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Maaf, saya sedang menyiapkan pesanan lain. Bisa ulangi pertanyaanmu?',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Terjadi sedikit kendala jaringan. Namun kamu tetap bisa melihat rekomendasi menu populer langsung di halaman menu ya!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-coffee-200 shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-coffee-950 via-coffee-900 to-coffee-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-coffee-950 flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-5 h-5 text-coffee-950 animate-spin" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-white">
                <span>Barista AI Kopi Mahasiswa</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">Online</span>
              </h3>
              <p className="text-[11px] text-amber-200/80">Panduan menu & rekomendasi rasa personal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-amber-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-cream/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-coffee-800 text-amber-200 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-coffee-800 to-coffee-900 text-amber-100 rounded-tr-xs'
                    : 'bg-white border border-coffee-200/80 text-coffee-950 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line prose prose-sm max-w-none">
                  {m.content}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-coffee-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-coffee-600 text-xs italic bg-white/80 p-2.5 rounded-2xl w-fit border border-coffee-200">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Barista AI sedang memikirkan rekomendasi terbaik...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-coffee-100 flex gap-2 overflow-x-auto no-scrollbar">
          {STARTER_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-coffee-50 hover:bg-amber-100/70 border border-coffee-200 text-coffee-800 font-medium transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-coffee-200/80 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Tanyakan rekomendasi kopi, budget, atau rasa..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-2xl bg-cream border border-coffee-200 text-coffee-950 focus:outline-none focus:border-coffee-700"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-coffee-900 text-amber-200 hover:bg-coffee-800 disabled:opacity-50 flex items-center justify-center shadow-md transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
