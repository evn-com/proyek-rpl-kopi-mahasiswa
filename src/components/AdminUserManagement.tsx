'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users, UserCheck, Search, ChevronLeft, ChevronRight,
  RefreshCw, Eye, X, Phone, Mail, GraduationCap, Edit2,
  Trash2, ShieldAlert, Send, ExternalLink, MessageSquare,
  Save, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import AdminMembershipApproval from './AdminMembershipApproval';

// ========== Types ==========

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isGuest: boolean;
  isActive?: boolean;
  membershipStatus: string | null;
  campus: string | null;
  points: number;
  createdAt: string;
}

interface AdminUserManagementProps {
  onShowToast: (text: string, type?: 'success' | 'error') => void;
  onRefreshPendingCount?: (count: number) => void;
}

// ========== Helpers ==========

const isAutoEmail = (email: string) => email?.endsWith('@mahasiswa.kopimahasiswa.local');

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'Admin':
      return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
    case 'Owner':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Cashier':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'Barista':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};

const getMembershipBadgeClass = (status: string | null) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'PENDING':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
    case 'REJECTED':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'INACTIVE':
      return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    default:
      return 'bg-slate-800 text-slate-500 border-slate-700';
  }
};

/**
 * Normalisasi nomor WhatsApp ke format internasional (628xxx)
 */
function normalizePhoneForWA(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// ========== Main Component ==========

export default function AdminUserManagement({
  onShowToast,
  onRefreshPendingCount,
}: AdminUserManagementProps) {
  const [subTab, setSubTab] = useState<'membership' | 'all-users'>('membership');

  return (
    <div className="space-y-6">
      {/* Tab Header Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          <span>Manajemen Pengguna &amp; Membership</span>
        </h2>
        <p className="text-xs text-slate-400">
          Kelola persetujuan membership, edit profil pengguna, kontrol status akun, dan komunikasi WhatsApp
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setSubTab('membership')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            subTab === 'membership'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Konfirmasi Membership</span>
        </button>
        <button
          onClick={() => setSubTab('all-users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            subTab === 'all-users'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Seluruh Pengguna</span>
        </button>
      </div>

      {/* Tab Content */}
      {subTab === 'membership' && (
        <AdminMembershipApproval
          onShowToast={onShowToast}
          onRefreshPendingCount={onRefreshPendingCount}
        />
      )}

      {subTab === 'all-users' && <AllUsersTab onShowToast={onShowToast} />}
    </div>
  );
}

// ========== All Users Tab ==========

function AllUsersTab({
  onShowToast,
}: {
  onShowToast: (text: string, type?: 'success' | 'error') => void;
}) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  // Modals state
  const [detailUser, setDetailUser] = useState<UserItem | null>(null);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    roleName: 'Customer',
    points: 0,
    campus: '',
    isActive: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // WhatsApp Contact Modal
  const [waModalUser, setWaModalUser] = useState<UserItem | null>(null);
  const [waMessage, setWaMessage] = useState('');
  const [sendingWA, setSendingWA] = useState(false);

  const toastRef = useRef(onShowToast);
  toastRef.current = onShowToast;

  const fetchUsers = async (overrideSearch?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const q = overrideSearch !== undefined ? overrideSearch : searchSubmitted;
      if (q) params.set('search', q);
      if (roleFilter) params.set('role', roleFilter);
      if (membershipFilter) params.set('membershipStatus', membershipFilter);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memuat data pengguna');
      }

      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      if (data.roleCounts) setRoleCounts(data.roleCounts);
    } catch (err: any) {
      toastRef.current(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, membershipFilter, page, searchSubmitted]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchSubmitted(search);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSearchSubmitted('');
    setRoleFilter('');
    setMembershipFilter('');
    setPage(1);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      roleName: user.role,
      points: user.points || 0,
      campus: user.campus || '',
      isActive: user.isActive !== false,
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toastRef.current('Data pengguna berhasil diperbarui', 'success');
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      toastRef.current(err.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Membership Only (Without deleting user)
  const handleDeleteMembership = async (userId: string, userName: string) => {
    if (!confirm(`Hapus status membership untuk "${userName}"? Akun pengguna dan riwayat transaksi akan tetap aman.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/membership`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toastRef.current(data.message || 'Membership berhasil dihapus', 'success');
      if (editUser) setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      toastRef.current(err.message, 'error');
    }
  };

  // Permanent Delete User (Safe Retention Policy)
  const handleDeleteUserPermanently = async (userId: string, userName: string) => {
    if (!confirm(`Hapus permanen akun "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }

      toastRef.current(data.message || 'Akun berhasil dihapus', 'success');
      if (editUser) setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      toastRef.current(err.message, 'error');
    }
  };

  // Open WhatsApp Modal
  const handleOpenWAModal = (user: UserItem) => {
    setWaModalUser(user);
    const initialText = `Halo Kak ${user.name}, salam dari Kopi Mahasiswa! ☕✨\n\n`;
    setWaMessage(initialText);
  };

  // Send WhatsApp via Fonnte Gateway
  const handleSendWA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waModalUser || !waModalUser.phone || !waMessage.trim()) return;

    setSendingWA(true);
    try {
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: waModalUser.phone,
          message: waMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toastRef.current('Pesan WhatsApp berhasil dikirim', 'success');
      setWaModalUser(null);
    } catch (err: any) {
      toastRef.current(err.message, 'error');
    } finally {
      setSendingWA(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Card */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, nomor WhatsApp, atau kampus..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari</span>
          </button>
          {(searchSubmitted || roleFilter || membershipFilter) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold">Filter Role:</span>
          {['', 'Customer', 'Cashier', 'Barista', 'Admin', 'Owner'].map((r) => {
            const count = r ? roleCounts[r] ?? 0 : total;
            const active = roleFilter === r;
            return (
              <button
                key={r || 'all'}
                onClick={() => {
                  setRoleFilter(r);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r || 'Semua Role'} ({count})
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-800 hidden sm:block mx-1" />

          <span className="text-slate-500 text-[11px] font-semibold">Status Member:</span>
          {[
            { id: '', label: 'Semua' },
            { id: 'APPROVED', label: 'Disetujui' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'NONE', label: 'Belum Daftar' },
          ].map((m) => {
            const active = membershipFilter === m.id;
            return (
              <button
                key={m.id || 'all-m'}
                onClick={() => {
                  setMembershipFilter(m.id);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {m.label}
              </button>
            );
          })}

          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Nama &amp; Akun</th>
                <th className="px-4 py-3.5">Kontak</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status Akun</th>
                <th className="px-4 py-3.5">Membership</th>
                <th className="px-4 py-3.5">Poin</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Memuat data pengguna...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data pengguna yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const active = u.isActive !== false;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Account info */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-xs">{u.name}</div>
                        {u.campus && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400/90 mt-0.5">
                            <GraduationCap className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]">{u.campus}</span>
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        {u.phone ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                        {!isAutoEmail(u.email) && (
                          <div className="flex items-center gap-1.5 text-slate-400 mt-0.5 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{u.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getRoleBadgeClass(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Account Status (Active vs Disabled) */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                            active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              active ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{active ? 'Aktif' : 'Dinonaktifkan'}</span>
                        </span>
                      </td>

                      {/* Membership Status */}
                      <td className="px-4 py-3.5">
                        {u.membershipStatus ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getMembershipBadgeClass(
                              u.membershipStatus
                            )}`}
                          >
                            {u.membershipStatus}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Points */}
                      <td className="px-4 py-3.5 font-bold text-amber-300 font-mono">
                        {u.points} Poin
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Hubungi WhatsApp Button */}
                        {u.phone && (
                          <button
                            onClick={() => handleOpenWAModal(u)}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 transition"
                            title="Hubungi via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit User Button */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Profil & Akun"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Detail Modal Button */}
                        <button
                          onClick={() => setDetailUser(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Detail Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/50">
            <span className="text-[11px] text-slate-500">
              Menampilkan {users.length} dari {total} pengguna — Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                      page === pageNum
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== EDIT USER MODAL ========== */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Pengguna: {editUser.name}</span>
              </h3>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Role Akun</label>
                  <select
                    value={editForm.roleName}
                    onChange={(e) => setEditForm({ ...editForm, roleName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Barista">Barista</option>
                    <option value="Admin">Admin</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Poin Pelanggan</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.points}
                    onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Kampus / Institusi</label>
                  <input
                    type="text"
                    value={editForm.campus}
                    onChange={(e) => setEditForm({ ...editForm, campus: e.target.value })}
                    placeholder="Contoh: Univ. Indonesia"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status Akun Toggle */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block">Status Akses Akun</span>
                  <span className="text-[11px] text-slate-400">
                    {editForm.isActive ? 'Akun aktif dan dapat login' : 'Akun dinonaktifkan (login diblokir)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                    editForm.isActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {editForm.isActive ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Danger Zone: Hapus Membership & Hapus Akun */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  Aksi Keamanan &amp; Retensi
                </span>
                <div className="flex flex-wrap gap-2">
                  {editUser.membershipStatus && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMembership(editUser.id, editUser.name)}
                      className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-600/40 text-amber-300 rounded-lg text-xs font-semibold transition"
                    >
                      Hapus Membership Saja
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteUserPermanently(editUser.id, editUser.name)}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 rounded-lg text-xs font-semibold transition"
                  >
                    Hapus Akun Permanen (Cek Retensi)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== WHATSAPP CONTACT MODAL ========== */}
      {waModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Hubungi via WhatsApp</span>
              </h3>
              <button onClick={() => setWaModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Penerima:</span>
                <span className="text-white font-bold">{waModalUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nomor WhatsApp:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  +{normalizePhoneForWA(waModalUser.phone || '')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSendWA} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Pesan WhatsApp (Dapat Diedit):
                </label>
                <textarea
                  rows={5}
                  required
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                {/* External WA Link */}
                <a
                  href={`https://wa.me/${normalizePhoneForWA(waModalUser.phone || '')}?text=${encodeURIComponent(
                    waMessage
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Web / App WA</span>
                </a>

                {/* Send directly via Fonnte Gateway */}
                <button
                  type="submit"
                  disabled={sendingWA || !waMessage.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingWA ? 'animate-pulse' : ''}`} />
                  <span>{sendingWA ? 'Mengirim...' : 'Kirim via Fonnte Gateway'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== USER DETAIL MODAL ========== */}
      {detailUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Detail Pengguna</span>
              </h3>
              <button
                onClick={() => setDetailUser(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Nama Lengkap
                </span>
                <span className="text-white font-bold text-sm">{detailUser.name}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Role</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border mt-1 ${getRoleBadgeClass(
                    detailUser.role
                  )}`}
                >
                  {detailUser.role}
                </span>
              </div>

              {detailUser.phone && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Nomor WhatsApp
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">{detailUser.phone}</span>
                </div>
              )}

              {!isAutoEmail(detailUser.email) && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Email
                  </span>
                  <span className="text-slate-300 font-medium break-all">{detailUser.email}</span>
                </div>
              )}

              {detailUser.campus && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Kampus
                  </span>
                  <span className="text-amber-300 font-medium">{detailUser.campus}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Poin</span>
                <span className="text-white font-bold">{detailUser.points} Poin</span>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Status Membership
                </span>
                {detailUser.membershipStatus ? (
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border mt-1 ${getMembershipBadgeClass(
                      detailUser.membershipStatus
                    )}`}
                  >
                    {detailUser.membershipStatus}
                  </span>
                ) : (
                  <span className="text-slate-500 mt-1 block">Tidak ada membership</span>
                )}
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Tanggal Registrasi
                </span>
                <span className="text-white font-medium">
                  {new Date(detailUser.createdAt).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  const u = detailUser;
                  setDetailUser(null);
                  handleOpenEdit(u);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Pengguna</span>
              </button>
              <button
                onClick={() => setDetailUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
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
