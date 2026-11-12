'use client';

import React, { useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNotificationPreferences from '@/components/AdminNotificationPreferences';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Left Sidebar Navigation */}
      <AdminSidebar
        activeTab="notifications"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0 transition-[padding] duration-300">
        <AdminNavbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle="Preferensi Notifikasi"
        />

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{toastMessage.message}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <AdminNotificationPreferences onShowToast={showToast} />
        </main>
      </div>
    </div>
  );
}

