'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Send,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  Eye,
  X,
  Phone,
  Mail,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface MembershipItem {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string;
  campus: string;
  points: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  rejectedAt: string | null;
  whatsappConsent: boolean;
  promoConsent: boolean;
  whatsappNotificationStatus: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  whatsappNotificationError: string | null;
  whatsappNotifiedAt: string | null;
  createdAt: string;
}

interface AdminMembershipApprovalProps {
  onShowToast: (text: string, type?: 'success' | 'error') => void;
  onRefreshPendingCount?: (count: number) => void;
}

export default function AdminMembershipApproval({
  onShowToast,
  onRefreshPendingCount,
}: AdminMembershipApprovalProps) {
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reject Modal
  const [rejectModalItem, setRejectModalItem] = useState<MembershipItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Detail Modal
  const [detailModalItem, setDetailModalItem] = useState<MembershipItem | null>(null);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (activeStatusFilter !== 'ALL') queryParams.set('status', activeStatusFilter);
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/memberships?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMemberships(data.memberships || []);
        if (data.counts) {
          setCounts(data.counts);
          onRefreshPendingCount?.(data.counts.pending || 0);
        }
      } else {
        const err = await res.json();
        onShowToast(err.error || 'Gagal memuat daftar membership', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching memberships:', err);
      onShowToast('Terjadi kendala jaringan saat memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [activeStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemberships();
  };

  // Handle Approve
  const handleApprove = async (item: MembershipItem) => {
    if (actionLoadingId) return;
    setActionLoadingId(item.id);

    try {
      const res = await fetch(`/api/admin/memberships/${item.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyetujui membership');

      onShowToast(data.message || `Membership ${item.name} berhasil disetujui!`, 'success');
      fetchMemberships();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async () => {
    if (!rejectModalItem || actionLoadingId) return;
    setActionLoadingId(rejectModalItem.id);

    try {
      const res = await fetch(`/api/admin/memberships/${rejectModalItem.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menolak membership');

      onShowToast(data.message || `Pendaftaran ${rejectModalItem.name} telah ditolak.`, 'success');
      setRejectModalItem(null);
      setRejectReason('');
      fetchMemberships();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Retry WhatsApp
  const handleRetryWhatsApp = async (item: MembershipItem) => {
    if (actionLoadingId) return;
    setActionLoadingId(item.id);

    try {
      const res = await fetch(`/api/admin/memberships/${item.id}/retry-whatsapp`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Gagal mengirim ulang WhatsApp');

      onShowToast('Notifikasi WhatsApp berhasil dikirim ulang!', 'success');
      fetchMemberships();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> VERIFIKASI ADMIN
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-400" />
            <span>Persetujuan Membership Mahasiswa</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verifikasi pendaftaran mahasiswa, setujui/tolak akun member, dan pantau pengiriman notifikasi WhatsApp.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchMemberships}
          className="self-start md:self-auto p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveStatusFilter('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeStatusFilter === 'ALL'
              ? 'bg-slate-800 border-amber-500/50 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Pendaftar</span>
          <div className="text-2xl font-black text-white mt-1">{counts.total}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Seluruh riwayat pendaftaran</span>
        </div>

        <div
          onClick={() => setActiveStatusFilter('PENDING')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeStatusFilter === 'PENDING'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Menunggu (Pending)</span>
            {counts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{counts.pending}</div>
          <span className="text-[10px] text-amber-300/80 mt-1 block">Wajib ditinjau admin</span>
        </div>

        <div
          onClick={() => setActiveStatusFilter('APPROVED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeStatusFilter === 'APPROVED'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Disetujui (Approved)</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{counts.approved}</div>
          <span className="text-[10px] text-emerald-300/80 mt-1 block">Member aktif Kopi Mahasiswa</span>
        </div>

        <div
          onClick={() => setActiveStatusFilter('REJECTED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeStatusFilter === 'REJECTED'
              ? 'bg-rose-950/40 border-rose-500 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Ditolak (Rejected)</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{counts.rejected}</div>
          <span className="text-[10px] text-rose-300/80 mt-1 block">Tidak memenuhi syarat</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'PENDING', label: `Menunggu (${counts.pending})` },
            { id: 'APPROVED', label: `Disetujui (${counts.approved})` },
            { id: 'REJECTED', label: `Ditolak (${counts.rejected})` },
            { id: 'ALL', label: `Semua (${counts.total})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeStatusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, nomor WA, kampus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </form>
      </div>

      {/* Table Membership */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800 font-bold">
              <tr>
                <th className="px-5 py-3.5">Pelanggan / Mahasiswa</th>
                <th className="px-4 py-3.5">WhatsApp</th>
                <th className="px-4 py-3.5">Asal Kampus</th>
                <th className="px-4 py-3.5">Tanggal Daftar</th>
                <th className="px-4 py-3.5">Status Membership</th>
                <th className="px-4 py-3.5">Status WhatsApp</th>
                <th className="px-5 py-3.5 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Memuat data pendaftaran membership...</span>
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Tidak ada data membership dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                memberships.map((m) => {
                  const isPending = m.status === 'PENDING';
                  const isApproved = m.status === 'APPROVED';
                  const isRejected = m.status === 'REJECTED';
                  const isActionLoading = actionLoadingId === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Email */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white text-sm">{m.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{m.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 font-mono text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{m.phone || '-'}</span>
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{m.campus}</span>
                        </div>
                      </td>

                      {/* CreatedAt */}
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status Membership */}
                      <td className="px-4 py-3.5">
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> PENDING
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> APPROVED
                          </span>
                        )}
                        {isRejected && (
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1 cursor-help"
                            title={m.rejectionReason || 'Ditolak admin'}
                          >
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        )}
                      </td>

                      {/* WhatsApp Notification Status */}
                      <td className="px-4 py-3.5">
                        {m.whatsappNotificationStatus === 'SENT' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40 inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Terkirim
                          </span>
                        )}
                        {m.whatsappNotificationStatus === 'FAILED' && (
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-600/40 inline-flex items-center gap-1 cursor-help"
                            title={m.whatsappNotificationError || 'Gagal mengirim WhatsApp'}
                          >
                            <AlertTriangle className="w-3 h-3" /> Gagal
                          </span>
                        )}
                        {m.whatsappNotificationStatus === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1">
                            Menunggu
                          </span>
                        )}
                        {m.whatsappNotificationStatus === 'SKIPPED' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700/80 inline-flex items-center gap-1">
                            Dilewati (Opt-out)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(m)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1 disabled:opacity-50"
                                title="Setujui Membership & Kirim WhatsApp"
                              >
                                {isActionLoading ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Setujui</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectModalItem(m);
                                  setRejectReason('');
                                }}
                                disabled={isActionLoading}
                                className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold rounded-lg border border-rose-800/60 transition flex items-center gap-1 disabled:opacity-50"
                                title="Tolak Pendaftaran"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {isApproved && m.whatsappNotificationStatus !== 'SENT' && m.whatsappConsent && (
                            <button
                              onClick={() => handleRetryWhatsApp(m)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/40 transition flex items-center gap-1 disabled:opacity-50"
                              title="Kirim Ulang Notifikasi WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Kirim Ulang WA</span>
                            </button>
                          )}

                          <button
                            onClick={() => setDetailModalItem(m)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Lihat Detail Pendaftaran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>Tolak Pendaftaran Membership</span>
              </h3>
              <button
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menolak permohonan membership dari{' '}
              <strong className="text-white">{rejectModalItem.name}</strong> ({rejectModalItem.campus})?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Alasan Penolakan (Tercatat di sistem):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Bukan mahasiswa aktif, nama institusi tidak valid, atau data ganda."
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              ℹ️ <strong>Catatan:</strong> Pendaftaran yang ditolak tidak akan menerima pesan persetujuan WhatsApp.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoadingId === rejectModalItem.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {actionLoadingId === rejectModalItem.id ? 'Memproses...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>Detail Pendaftaran Membership</span>
              </h3>
              <button
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Nama Lengkap</span>
                <span className="text-white font-bold text-sm">{detailModalItem.name}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Nomor WhatsApp</span>
                <span className="text-emerald-400 font-mono font-bold">{detailModalItem.phone || '-'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Asal Kampus</span>
                <span className="text-amber-300 font-medium">{detailModalItem.campus}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo Poin</span>
                <span className="text-white font-bold">{detailModalItem.points} Poin</span>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Status Membership</span>
                <span className="text-sm font-black text-amber-400">{detailModalItem.status}</span>
                {detailModalItem.approvedAt && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Disetujui pada {new Date(detailModalItem.approvedAt).toLocaleString('id-ID')}
                    {detailModalItem.approvedByName ? ` oleh ${detailModalItem.approvedByName}` : ''}
                  </p>
                )}
                {detailModalItem.rejectionReason && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    Alasan Ditolak: {detailModalItem.rejectionReason}
                  </p>
                )}
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Status WhatsApp Gateway</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{detailModalItem.whatsappNotificationStatus}</span>
                  <span className="text-slate-400">
                    • Persetujuan WA: {detailModalItem.whatsappConsent ? '✅ Ya (Opt-in)' : '❌ Tidak (Opt-out)'}
                  </span>
                  <span className="text-slate-400">
                    • Promo Harian: {detailModalItem.promoConsent ? '✅ Ya' : '❌ Tidak'}
                  </span>
                </div>
                {detailModalItem.whatsappNotificationError && (
                  <p className="text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-900/40 mt-1">
                    Error Log: {detailModalItem.whatsappNotificationError}
                  </p>
                )}
                {detailModalItem.whatsappNotifiedAt && (
                  <p className="text-[11px] text-emerald-400 mt-1">
                    Notifikasi terkirim pada {new Date(detailModalItem.whatsappNotifiedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
