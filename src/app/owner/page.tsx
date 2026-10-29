'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Coffee,
  Users,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  BarChart3,
  Clock,
  Wallet,
  QrCode,
  ShieldCheck,
  Package,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export default function OwnerDashboardPage() {
  const [dataRange, setDataRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [res, aiRes] = await Promise.all([
        fetch(`/api/owner/analytics?range=${dataRange}`),
        fetch(`/api/ai/analytics?days=${dataRange === 'today' ? 1 : dataRange === '7d' ? 7 : 30}`),
      ]);

      if (res.ok) {
        setAnalytics(await res.json());
      }
      if (aiRes.ok) {
        setAiInsights(await aiRes.json());
      }
    } catch (err) {
      console.error('Error loading owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dataRange]);

  const summary = analytics?.summary || {
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    estimatedProfit: 0,
    profitMargin: 0,
  };

  const salesByDay = analytics?.salesByDay || [];
  const salesByHour = analytics?.salesByHour || [];
  const salesByCategory = analytics?.salesByCategory || [];
  const bestSelling = analytics?.bestSelling || [];
  const lowPerforming = analytics?.lowPerforming || [];
  const customers = analytics?.customers || { newCustomers: 0, returningCustomers: 0 };
  const lowStockAlerts = analytics?.lowStockAlerts || [];

  const maxDailyRevenue = Math.max(...salesByDay.map((d: any) => d.revenue), 100000);
  const maxHourlyOrders = Math.max(...salesByHour.map((h: any) => h.orders), 1);

  return (
    <div className="w-full pb-16">
      <main className="max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Top Header & Range Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> READ-ONLY EXECUTIVE ACCESS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Analitik & Performa Bisnis</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemantauan omzet, laba estimasi, perputaran produk, dan proyeksi kecerdasan buatan.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start md:self-auto">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7d', label: '7 Hari' },
              { id: '30d', label: '30 Hari' },
              { id: 'all', label: 'Semua' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDataRange(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dataRange === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={fetchAnalytics}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. Core Financial Metric Cards */}
        <div id="overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 scroll-mt-24">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pendapatan</span>
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              Rp {summary.totalRevenue.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-emerald-400 font-bold block mt-2">
              ✓ Berdasarkan transaksi terverifikasi
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Jumlah Transaksi</span>
              <Coffee className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {summary.totalTransactions} <span className="text-xs text-slate-400 font-semibold">Pesanan</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">
              Rata-rata: <strong>Rp {summary.averageOrderValue.toLocaleString('id-ID')}</strong> / pesanan
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimasi Laba Kotor</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              Rp {summary.estimatedProfit.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-emerald-300 font-bold block mt-2">
              Margin Estimasi: ~{summary.profitMargin}% (HPP Recipe BOM)
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pelanggan Aktif</span>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {customers.newCustomers + customers.returningCustomers}
            </div>
            <div className="flex gap-2 text-[11px] text-slate-400 mt-2">
              <span>Baru: <strong className="text-amber-400">{customers.newCustomers}</strong></span>
              <span>•</span>
              <span>Repeat: <strong className="text-emerald-400">{customers.returningCustomers}</strong></span>
            </div>
          </div>
        </div>

        {/* 2. Charts Section */}
        <div id="tren-penjualan" className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-24">
          {/* Daily Sales Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Tren Penjualan Harian</span>
                </h3>
                <p className="text-xs text-slate-400">Pergerakan omzet harian pada rentang terpilih</p>
              </div>
            </div>

            {salesByDay.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                Belum ada transaksi di rentang tanggal ini.
              </div>
            ) : (
              <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800 overflow-x-auto">
                {salesByDay.map((d: any, idx: number) => {
                  const heightPercent = Math.max(10, Math.round((d.revenue / maxDailyRevenue) * 100));
                  return (
                    <div key={idx} className="flex-1 min-w-[40px] flex flex-col items-center gap-1 group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap">
                        Rp {Math.round(d.revenue / 1000)}k
                      </div>
                      <div className="w-full bg-slate-800 rounded-t-lg h-36 flex items-end overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg group-hover:brightness-125 transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Breakdown Donut / Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>Penjualan Per Kategori</span>
            </h3>

            <div className="space-y-3 pt-2">
              {salesByCategory.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada data kategori.</p>
              ) : (
                salesByCategory.map((cat: any, i: number) => {
                  const percent = summary.totalRevenue > 0 ? Math.round((cat.revenue / summary.totalRevenue) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-200">{cat.name}</span>
                        <span className="text-amber-400">Rp {cat.revenue.toLocaleString('id-ID')} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Payment Method Split */}
            <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Metode Pembayaran</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kasir / Tunai</span>
                    <strong className="text-white">{analytics?.paymentMethods?.PAY_AT_CASHIER || 0} order</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">QRIS / Online</span>
                    <strong className="text-white">{analytics?.paymentMethods?.ONLINE_PAYMENT || 0} order</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Peak Hours (Sales by Hour) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Distribusi Jam Sibuk (Sales by Hour)</span>
              </h3>
              <p className="text-xs text-slate-400">Mengetahui jam lonjakan kunjungan mahasiswa di kedai (07:00 - 23:00)</p>
            </div>
          </div>

          <div className="h-32 flex items-end gap-1.5 pt-4 pb-2 px-2 overflow-x-auto no-scrollbar">
            {salesByHour.map((h: any) => {
              const hHeight = Math.max(5, Math.round((h.orders / maxHourlyOrders) * 100));
              return (
                <div key={h.hour} className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group">
                  <div className="w-full bg-slate-800 rounded-t h-20 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t transition-all ${
                        h.orders > 0 ? 'bg-amber-400 group-hover:bg-amber-300' : 'bg-slate-700/50'
                      }`}
                      style={{ height: `${hHeight}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{h.hour}h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Best-Selling vs Low-Performing Products & Inventory Alerts */}
        <div id="stok-bahan" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
          {/* Best Selling */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Top 5 Produk Terlaris</span>
            </h3>

            <div className="space-y-2.5">
              {bestSelling.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada data penjualan.</p>
              ) : (
                bestSelling.map((prod: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-white">{prod.name}</h4>
                        <span className="text-[11px] text-slate-400">{prod.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-amber-400 block">{prod.qty} Terjual</span>
                      <span className="text-[10px] text-slate-400">Rp {prod.revenue.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock & Ingredient Status */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-rose-400" />
              <span>Peringatan Stok & Bahan Baku Rendah</span>
            </h3>

            <div className="space-y-2.5">
              {lowStockAlerts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Semua bahan baku saat ini berada dalam ambang batas aman.
                </div>
              ) : (
                lowStockAlerts.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <div>
                        <h4 className="font-bold text-white">{item.name}</h4>
                        <span className="text-[11px] text-rose-300">Min. Ambang: {item.min} {item.unit}</span>
                      </div>
                    </div>

                    <span className="font-extrabold text-rose-400 bg-rose-950 px-2.5 py-1 rounded-xl border border-rose-500/30">
                      Sisa: {item.stock} {item.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 5. ✨ AI BUSINESS INSIGHTS & FORECASTING */}
        <div id="ai-insights" className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-amber-950/30 border border-purple-500/40 shadow-2xl space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
                <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">✨ AI Business Insights & Forecasting</h3>
                <p className="text-xs text-purple-200/80">Proyeksi cerdas penjualan, kebutuhan inventori, dan rekomendasi promo</p>
              </div>
            </div>

            {aiInsights && (
              <span className="text-[11px] font-bold text-purple-300 bg-purple-950/80 px-3 py-1.5 rounded-full border border-purple-500/30">
                Confidence: {aiInsights.salesForecasting?.confidence || 88}% • Periode: {aiInsights.period}
              </span>
            )}
          </div>

          {aiInsights ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customer Analytics */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/20 space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Analitik Pelanggan AI
                </div>
                <div className="text-xl font-black text-white">
                  {aiInsights.customerAnalytics?.totalUniqueCustomers || 0}
                  <span className="text-xs text-slate-400 block font-normal mt-0.5">Total pelanggan terdata</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>VIP (&gt;3 order):</span>
                    <span className="font-bold text-amber-400">{aiInsights.customerAnalytics?.vipCustomers || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Pelanggan Baru:</span>
                    <span className="font-bold text-emerald-400">{aiInsights.customerAnalytics?.newCustomers || 0}</span>
                  </div>
                </div>
                <p className="text-[11px] text-purple-200/80 bg-purple-950/40 p-2 rounded-xl border border-purple-500/20">
                  💡 {aiInsights.customerAnalytics?.inactiveTrend}
                </p>
              </div>

              {/* Sales Forecast */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/20 space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Proyeksi Penjualan
                </div>
                <div className="text-xl font-black text-white">
                  Rp {aiInsights.salesForecasting?.nextDayEstimatedRevenue?.toLocaleString('id-ID')}
                  <span className="text-xs text-slate-400 block font-normal mt-0.5">Estimasi esok hari</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aiInsights.salesForecasting?.nextMonthTrend}
                </p>
                <div className="text-[11px] text-amber-300/90 pt-1">
                  ⏰ Jam Puncak Prediksi: <strong>{aiInsights.salesForecasting?.peakHours}</strong>
                </div>
              </div>

              {/* Inventory Forecast */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/20 space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> Prediksi Kebutuhan Bahan
                </div>
                {aiInsights.inventoryForecasting?.insights?.length > 0 ? (
                  <div className="space-y-2">
                    {aiInsights.inventoryForecasting.insights.slice(0, 2).map((ins: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <strong className="text-rose-400 block">{ins.ingredient}</strong>
                        <p className="text-slate-300 text-[11px] mt-0.5">{ins.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiInsights.inventoryForecasting?.defaultAlert || 'Semua stok bahan baku aman untuk konsumsi 7 hari ke depan.'}
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">Berdasarkan konsumsi Recipe BOM</span>
              </div>

              {/* Promo Recommendation */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/20 space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Rekomendasi Promosi AI
                </div>
                {aiInsights.promotionRecommendation?.recommendations?.slice(0, 2).map((rec: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <strong className="text-amber-300 block">{rec.title}</strong>
                    <p className="text-slate-300 text-[11px]">{rec.reason}</p>
                  </div>
                ))}
                <span className="text-[10px] text-slate-500 block">AI hanya memberikan rekomendasi; keputusan akhir ada di tangan manajemen.</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Memuat analitik AI...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
