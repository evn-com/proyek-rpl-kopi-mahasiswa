/**
 * hooks/useStreamingChat.ts
 * ──────────────────────────────────────────────────────────────
 * Custom React hook untuk membaca SSE stream dari /api/chat.
 *
 * Fitur:
 * - Real-time typewriter streaming effect
 * - Rate-limit error handling (429) dengan countdown
 * - Input terlalu panjang error (400)
 * - Loading state, error state
 * - Karakter counter
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { RATE_LIMIT_CONFIG } from '@/lib/ai/rateLimiter';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export interface StreamingChatError {
  type: 'rate_limit' | 'input_too_long' | 'network' | 'server';
  message: string;
  resetInSeconds?: number;
}

export const MAX_INPUT_CHARS = RATE_LIMIT_CONFIG.maxInputChars;

export function useStreamingChat(
  mode: 'barista' | 'research' = 'barista',
  initialMessages: ChatMessage[] = []
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<StreamingChatError | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Jumlah karakter saat ini, dipakai untuk counter UI */
  const charCount = input.length;
  const isOverLimit = charCount > MAX_INPUT_CHARS;

  const startRateLimitCountdown = useCallback((seconds: number) => {
    setRateLimitCountdown(seconds);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();

      // Guards
      if (!text || isStreaming) return;
      if (text.length > MAX_INPUT_CHARS) {
        setError({
          type: 'input_too_long',
          message: `Pesan terlalu panjang (${text.length}/${MAX_INPUT_CHARS} karakter). Harap persingkat pesan kamu.`,
        });
        return;
      }
      if (rateLimitCountdown > 0) return;

      setError(null);
      setInput('');

      // Tambahkan pesan user ke list
      const userMsg: ChatMessage = { role: 'user', content: text };
      const updatedMessages: ChatMessage[] = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);

      // Siapkan placeholder untuk respons streaming
      const assistantPlaceholder: ChatMessage = {
        role: 'assistant',
        content: '',
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantPlaceholder]);

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map(({ role, content }) => ({ role, content })),
            mode,
          }),
          signal: abortControllerRef.current.signal,
        });

        // Handle non-streaming error responses
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));

          if (res.status === 429) {
            const resetSec = errorData.resetInSeconds ?? 60;
            setError({
              type: 'rate_limit',
              message: errorData.error ?? `Batas pesan tercapai. Tunggu ${resetSec} detik.`,
              resetInSeconds: resetSec,
            });
            startRateLimitCountdown(resetSec);
          } else if (res.status === 400 && errorData.code === 'INPUT_TOO_LONG') {
            setError({
              type: 'input_too_long',
              message: errorData.error ?? 'Pesan terlalu panjang.',
            });
          } else {
            setError({
              type: 'server',
              message: errorData.error ?? 'Terjadi kesalahan pada server AI.',
            });
          }

          // Remove placeholder
          setMessages((prev) => prev.filter((m) => !m.isStreaming));
          return;
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        if (!reader) throw new Error('Response body tidak tersedia.');

        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6); // remove "data: "
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                // Update the streaming message
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (copy[lastIdx]?.isStreaming) {
                    copy[lastIdx] = {
                      ...copy[lastIdx],
                      content: accumulated,
                    };
                  }
                  return copy;
                });
              }
            } catch {
              // JSON parse error on individual chunk — skip
            }
          }
        }

        // Mark streaming done
        setMessages((prev) => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          if (copy[lastIdx]?.isStreaming) {
            copy[lastIdx] = {
              role: 'assistant',
              content: accumulated || 'Maaf, tidak ada respons dari AI.',
              isStreaming: false,
            };
          }
          return copy;
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User cancelled
          setMessages((prev) =>
            prev.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false, content: m.content + ' _(Dibatalkan)_' } : m
            )
          );
          return;
        }

        console.error('[useStreamingChat] Error:', err);
        setError({
          type: 'network',
          message: 'Koneksi terputus. Periksa koneksi internetmu dan coba lagi.',
        });
        setMessages((prev) => prev.filter((m) => !m.isStreaming));
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [input, isStreaming, messages, mode, rateLimitCountdown, startRateLimitCountdown]
  );

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput('');
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isStreaming,
    error,
    charCount,
    isOverLimit,
    rateLimitCountdown,
    maxInputChars: MAX_INPUT_CHARS,
    sendMessage,
    stopStream,
    clearMessages,
    dismissError,
  };
}
