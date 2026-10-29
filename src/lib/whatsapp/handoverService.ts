/**
 * lib/whatsapp/handoverService.ts
 * ──────────────────────────────────────────────────────────────
 * Layanan Human Handover & Live Chat Inbox untuk WhatsApp Kopi Mahasiswa.
 * Mengontrol status BOT_ACTIVE vs HUMAN_ACTIVE per percakapan nomor pelanggan.
 * 
 * Aturan Bisnis:
 * 1. Saat BOT_ACTIVE: AI boleh menjawab pesan otomatis sesuai knowledge base database kafe.
 * 2. Saat HUMAN_ACTIVE: AI TIDAK BOLEH menjawab otomatis. Staf menangani percakapan langsung.
 * 3. Ambil Alih Percakapan mengubah status ke HUMAN_ACTIVE, mencatat nama staf dan waktu.
 * 4. Kembalikan ke Bot mengubah status kembali ke BOT_ACTIVE.
 * 5. Mencegah balasan AI tertunda saat staf sedang menangani pelanggan.
 */

import { formatPhoneNumber } from './fonnteClient';

export type BotStatus = 'BOT_ACTIVE' | 'HUMAN_ACTIVE';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'bot' | 'staff';
  text: string;
  timestamp: string; // ISO string
  staffName?: string;
}

export interface ConversationSession {
  phone: string; // normalized (e.g. 628xxx)
  customerName: string;
  status: BotStatus;
  takenOverBy: string | null;
  takenOverAt: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ChatMessage[];
}

// In-Memory store untuk percakapan WhatsApp & status handover
// Dapat diakses secara global di runtime server
const conversationsStore = new Map<string, ConversationSession>();

// In-memory processed message IDs untuk mencegah duplikasi webhook retry
const processedMessageIds = new Map<string, number>();
const MESSAGE_ID_TTL_MS = 60 * 1000; // 60 detik

/**
 * Membersihkan ID pesan yang sudah lewat masa TTL deduplikasi
 */
function cleanupMessageIds() {
  const now = Date.now();
  for (const [id, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > MESSAGE_ID_TTL_MS) {
      processedMessageIds.delete(id);
    }
  }
}

/**
 * Cek apakah message ID Fonnte sudah pernah diproses
 */
export function isMessageAlreadyProcessed(messageId?: string | null): boolean {
  if (!messageId || messageId.trim() === '') return false;
  cleanupMessageIds();

  const id = messageId.trim();
  if (processedMessageIds.has(id)) {
    return true;
  }

  processedMessageIds.set(id, Date.now());
  return false;
}

/**
 * Mendapatkan atau membuat sesi percakapan untuk nomor tertentu
 */
export function getOrCreateConversation(phone: string, customerName?: string): ConversationSession {
  const normalized = formatPhoneNumber(phone) || phone;
  let session = conversationsStore.get(normalized);

  if (!session) {
    session = {
      phone: normalized,
      customerName: customerName || `Pelanggan (${normalized})`,
      status: 'BOT_ACTIVE',
      takenOverBy: null,
      takenOverAt: null,
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      messages: [],
    };
    conversationsStore.set(normalized, session);
  } else if (customerName && customerName !== session.customerName && !session.customerName.includes('Pelanggan (')) {
    session.customerName = customerName;
  }

  return session;
}

/**
 * Cek apakah bot diizinkan membalas untuk nomor ini
 */
export function isBotActiveForPhone(phone: string): boolean {
  const normalized = formatPhoneNumber(phone) || phone;
  const session = conversationsStore.get(normalized);
  if (!session) return true; // Default BOT_ACTIVE
  return session.status === 'BOT_ACTIVE';
}

/**
 * Menambahkan pesan yang dikirim oleh pelanggan
 */
export function recordCustomerMessage(
  phone: string,
  text: string,
  name?: string,
  messageId?: string
): ConversationSession {
  const session = getOrCreateConversation(phone, name);
  const now = new Date().toISOString();

  const msg: ChatMessage = {
    id: messageId || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'customer',
    text,
    timestamp: now,
  };

  session.messages.push(msg);
  if (session.messages.length > 50) {
    session.messages.shift();
  }

  session.lastMessage = text;
  session.lastMessageAt = now;
  session.unreadCount += 1;

  return session;
}

/**
 * Menambahkan pesan balasan yang dikirim oleh AI Bot
 */
export function recordBotMessage(phone: string, text: string): void {
  const session = getOrCreateConversation(phone);
  const now = new Date().toISOString();

  const msg: ChatMessage = {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'bot',
    text,
    timestamp: now,
  };

  session.messages.push(msg);
  if (session.messages.length > 50) {
    session.messages.shift();
  }

  session.lastMessage = `[Bot] ${text.slice(0, 60)}...`;
  session.lastMessageAt = now;
}

/**
 * Menambahkan pesan yang dikirim oleh staf secara manual
 */
export function recordStaffMessage(phone: string, text: string, staffName: string): void {
  const session = getOrCreateConversation(phone);
  const now = new Date().toISOString();

  const msg: ChatMessage = {
    id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'staff',
    text,
    timestamp: now,
    staffName,
  };

  session.messages.push(msg);
  if (session.messages.length > 50) {
    session.messages.shift();
  }

  session.lastMessage = `[${staffName}] ${text.slice(0, 60)}...`;
  session.lastMessageAt = now;
  session.unreadCount = 0; // Staf sudah membalas, reset unread
}

/**
 * Mengubah status percakapan (Ambil Alih Percakapan / Kembalikan ke Bot)
 */
export function updateHandoverStatus(
  phone: string,
  newStatus: BotStatus,
  staffName?: string
): ConversationSession {
  const session = getOrCreateConversation(phone);
  session.status = newStatus;

  if (newStatus === 'HUMAN_ACTIVE') {
    session.takenOverBy = staffName || 'Staf Admin';
    session.takenOverAt = new Date().toISOString();
  } else {
    session.takenOverBy = null;
    session.takenOverAt = null;
  }

  return session;
}

/**
 * Mengambil daftar seluruh sesi percakapan aktif
 */
export function getAllConversationsList(): ConversationSession[] {
  const list = Array.from(conversationsStore.values());
  // Sort descending berdasarkan pesan terakhir
  list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  return list;
}

/**
 * Reset status unread saat staf membuka percakapan
 */
export function markConversationAsRead(phone: string): void {
  const normalized = formatPhoneNumber(phone) || phone;
  const session = conversationsStore.get(normalized);
  if (session) {
    session.unreadCount = 0;
  }
}
