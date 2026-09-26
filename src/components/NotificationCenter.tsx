'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink, Coffee, AlertCircle, Sparkles, X } from 'lucide-react';

export interface NotificationItem {
  id: string;
  userId?: string | null;
  targetRole?: string | null;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for SSE real-time notifications
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'NOTIFICATION' || msg.type === 'ORDER_STATUS_CHANGED' || msg.type === 'ORDER_CREATED') {
          fetchNotifications();
        }
      } catch (err) {
        // Heartbeat or ping
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      eventSource.close();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'INVENTORY':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'AI':
      case 'PROMO':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-coffee-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-coffee-800 hover:bg-coffee-100/80 transition-colors focus:outline-none"
        title="Pusat Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-coffee-200/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 bg-gradient-to-r from-coffee-900 to-coffee-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-300" />
              <h3 className="font-bold text-sm">Pusat Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-coffee-950 text-[10px] font-extrabold">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-amber-200 hover:text-white flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Tandai Semua Dibaca
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-coffee-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-coffee-600">
                <Bell className="w-8 h-8 text-coffee-300 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Belum ada notifikasi baru.</p>
                <p className="text-[11px] text-coffee-400 mt-1">Status pesanan dan kabar promo akan muncul di sini.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-coffee-50/80 ${
                    n.isRead ? 'bg-white opacity-85' : 'bg-amber-50/50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-coffee-100/70 shrink-0 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${n.isRead ? 'text-coffee-900' : 'text-coffee-950'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-coffee-400 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-coffee-700 mt-1 leading-snug break-words">
                      {n.message}
                    </p>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => setIsOpen(false)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-coffee-800 hover:text-coffee-950 hover:underline"
                      >
                        <span>Buka Halaman</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
