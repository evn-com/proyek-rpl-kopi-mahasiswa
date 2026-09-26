import { prisma } from './prisma';

export interface NotificationPayload {
  userId?: string | null;
  targetRole?: 'Customer' | 'Cashier' | 'Barista' | 'Admin' | 'Owner' | string;
  title: string;
  message: string;
  type?: 'ORDER' | 'PAYMENT' | 'INVENTORY' | 'SYSTEM' | 'AI' | 'PROMO' | string;
  link?: string;
}

class EventBus {
  private clients: Set<(data: string) => void> = new Set();
  private recentNotificationHashes: Map<string, number> = new Map();

  public subscribe(client: (data: string) => void) {
    this.clients.add(client);
    return () => {
      this.clients.delete(client);
    };
  }

  public emit(eventType: string, data: any) {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      try {
        client(payload);
      } catch (err) {
        console.error('Error sending SSE message:', err);
      }
    }
  }

  /**
   * Emits an SSE event and persists a notification with deduplication.
   */
  public async notify(notif: NotificationPayload) {
    const hash = `${notif.userId || ''}-${notif.targetRole || ''}-${notif.title}-${notif.message}`;
    const now = Date.now();
    const lastSent = this.recentNotificationHashes.get(hash);

    // Deduplication check: ignore identical notifications within 5 seconds
    if (lastSent && now - lastSent < 5000) {
      return null;
    }
    this.recentNotificationHashes.set(hash, now);

    // Broadcast through SSE
    this.emit('NOTIFICATION', notif);

    // Persist to database
    try {
      return await (prisma as any).notification.create({
        data: {
          userId: notif.userId || null,
          targetRole: notif.targetRole || null,
          title: notif.title,
          message: notif.message,
          type: notif.type || 'INFO',
          link: notif.link || null,
          isRead: false,
        },
      });
    } catch (err) {
      console.error('Failed to persist notification:', err);
      return null;
    }
  }
}

export const globalEventBus = new EventBus();
export const notify = (notif: NotificationPayload) => globalEventBus.notify(notif);
