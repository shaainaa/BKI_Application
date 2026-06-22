"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, Check, ChevronDown, Loader2, RefreshCw, Search, TrendingUp, WalletCards } from 'lucide-react';
import AdminFilterDropdown from '@/components/AdminFilterDropdown';
import ImportExcel from './components/ImportExcel';

type Summary = {
  totalBilling: number;
  totalCollected: number;
  totalOutstanding: number;
  cei: number;
};

type TopDebtor = {
  namaPerusahaan: string;
  totalOutstanding: number;
};

type DistributionItem = {
  name: string;
  total: number;
  count: number;
};

type InvoiceRow = {
  namaPerusahaan: string;
  namaObjek: string;
  invoiceNumber: string;
  documentDate: string | null;
  postingDate: string | null;
  nominalTagihan: number;
  nominalAngsuran: number;
  saldoPiutang: number;
  agingDays: number;
  riskCategory: string;
  statusPelunasan: string;
};

type AnalyticsData = {
  summary: Summary;
  topDebtors: TopDebtor[];
  riskDistribution: DistributionItem[];
  repaymentDistribution: DistributionItem[];
  invoiceRows: InvoiceRow[];
};

const EMPTY_ANALYTICS: AnalyticsData = {
  summary: {
    totalBilling: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    cei: 0,
  },
  topDebtors: [],
  riskDistribution: [],
  repaymentDistribution: [],
  invoiceRows: [],
};

const RISK_ORDER = [
  'Lunas',
  '0-30 Hari (Lancar)',
  '31-90 Hari (Kurang Lancar)',
  '91-365 Hari (Diragukan)',
  '>365 Hari (Macet/Bad Debt)',
];

const RISK_COLORS: Record<string, string> = {
  Lunas: '#10b981',
  '0-30 Hari (Lancar)': '#0ea5e9',
  '31-90 Hari (Kurang Lancar)': '#f59e0b',
  '91-365 Hari (Diragukan)': '#f97316',
  '>365 Hari (Macet/Bad Debt)': '#ef4444',
};

const REPAYMENT_ORDER = [
  'Lunas (100%)',
  'Progres Baik (>=50%)',
  'Progres Rendah (<50%)',
  'Belum Ada Cicilan (0%)',
];

const REPAYMENT_COLORS: Record<string, string> = {
  'Lunas (100%)': '#10b981',
  'Progres Baik (>=50%)': '#0ea5e9',
  'Progres Rendah (<50%)': '#f59e0b',
  'Belum Ada Cicilan (0%)': '#ef4444',
};

const RISK_FILTERS = [
  '>365 Hari (Macet/Bad Debt)',
  '91-365 Hari (Diragukan)',
  '31-90 Hari (Kurang Lancar)',
  '0-30 Hari (Lancar)',
  'Lunas',
];

const REPAYMENT_FILTERS = [...REPAYMENT_ORDER];

const SORT_OPTIONS = [
  { value: 'risk_desc', label: 'Risiko tertinggi' },
  { value: 'saldo_desc', label: 'Saldo terbesar' },
  { value: 'aging_desc', label: 'Umur terlama' },
  { value: 'company_asc', label: 'Perusahaan A-Z' },
  { value: 'posting_desc', label: 'Posting terbaru' },
  { value: 'posting_asc', label: 'Posting terlama' },
];

const PAGE_SIZE = 15;

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactRupiah(value: number) {
  const abs = Math.abs(value || 0);
  if (abs >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(2)} T`;
  if (abs >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
  if (abs >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
  return formatRupiah(value);
}

function normalizeDistribution(items: DistributionItem[], order: string[]) {
  const byName = new Map(items.map((item) => [item.name, item]));
  return order.map((name) => byName.get(name) || { name, total: 0, count: 0 });
}

function shortName(value: string) {
  return value.length > 34 ? `${value.slice(0, 34)}...` : value;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function riskBadgeClass(value: string) {
  if (value === 'Lunas') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === '0-30 Hari (Lancar)') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (value === '31-90 Hari (Kurang Lancar)') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (value === '91-365 Hari (Diragukan)') return 'border-orange-200 bg-orange-50 text-orange-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function riskRank(value: string) {
  if (value === '>365 Hari (Macet/Bad Debt)') return 5;
  if (value === '91-365 Hari (Diragukan)') return 4;
  if (value === '31-90 Hari (Kurang Lancar)') return 3;
  if (value === '0-30 Hari (Lancar)') return 2;
  if (value === 'Lunas') return 1;
  return 0;
}

function dateTime(value: string | null) {
  if (!value) return 0;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function LaporanPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [repaymentFilter, setRepaymentFilter] = useState<string[]>([]);
  const [postingStart, setPostingStart] = useState('');
  const [postingEnd, setPostingEnd] = useState('');
  const [minSaldo, setMinSaldo] = useState('');
  const [maxSaldo, setMaxSaldo] = useState('');
  const [sortBy, setSortBy] = useState('risk_desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/piutang/analytics', { cache: 'no-store' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memuat laporan piutang.');
      }

      setData(result.data || EMPTY_ANALYTICS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat laporan piutang.';
      setError(message);
      setData(EMPTY_ANALYTICS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const riskDistribution = useMemo(
    () => normalizeDistribution(data.riskDistribution, RISK_ORDER),
    [data.riskDistribution]
  );
  const repaymentDistribution = useMemo(
    () => normalizeDistribution(data.repaymentDistribution, REPAYMENT_ORDER),
    [data.repaymentDistribution]
  );

  const companyOptions = useMemo(
    () => Array.from(new Set(data.invoiceRows.map((item) => item.namaPerusahaan).filter(Boolean))),
    [data.invoiceRows]
  );

  const filteredInvoices = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const minSaldoValue = parsePositiveNumber(minSaldo);
    const maxSaldoValue = parsePositiveNumber(maxSaldo);

    return data.invoiceRows.filter((item) => {
      const matchesCompany = companyFilter.length === 0 || companyFilter.includes(item.namaPerusahaan);
      const matchesRisk = riskFilter.length === 0 || riskFilter.includes(item.riskCategory);
      const matchesRepayment = repaymentFilter.length === 0 || repaymentFilter.includes(item.statusPelunasan);
      const matchesPostingStart = !postingStart || Boolean(item.postingDate && item.postingDate >= postingStart);
      const matchesPostingEnd = !postingEnd || Boolean(item.postingDate && item.postingDate <= postingEnd);
      const matchesMinSaldo = minSaldoValue === null || item.saldoPiutang >= minSaldoValue;
      const matchesMaxSaldo = maxSaldoValue === null || item.saldoPiutang <= maxSaldoValue;
      const matchesSearch =
        !search ||
        item.namaPerusahaan.toLowerCase().includes(search) ||
        item.namaObjek.toLowerCase().includes(search) ||
        item.invoiceNumber.toLowerCase().includes(search);

      return (
        matchesRisk &&
        matchesRepayment &&
        matchesCompany &&
        matchesPostingStart &&
        matchesPostingEnd &&
        matchesMinSaldo &&
        matchesMaxSaldo &&
        matchesSearch
      );
    }).sort((a, b) => {
      if (sortBy === 'saldo_desc') return b.saldoPiutang - a.saldoPiutang;
      if (sortBy === 'aging_desc') return b.agingDays - a.agingDays;
      if (sortBy === 'company_asc') return a.namaPerusahaan.localeCompare(b.namaPerusahaan);
      if (sortBy === 'posting_desc') return dateTime(b.postingDate) - dateTime(a.postingDate);
      if (sortBy === 'posting_asc') return dateTime(a.postingDate) - dateTime(b.postingDate);

      const riskDiff = riskRank(b.riskCategory) - riskRank(a.riskCategory);
      if (riskDiff !== 0) return riskDiff;
      return b.saldoPiutang - a.saldoPiutang;
    });
  }, [companyFilter, data.invoiceRows, maxSaldo, minSaldo, postingEnd, postingStart, repaymentFilter, riskFilter, searchTerm, sortBy]);

  const totalFilteredSaldo = useMemo(
    () => filteredInvoices.reduce((total, item) => total + item.saldoPiutang, 0),
    [filteredInvoices]
  );

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const pagedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [companyFilter, maxSaldo, minSaldo, postingEnd, postingStart, repaymentFilter, riskFilter, searchTerm, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const scorecards = [
    {
      title: 'Total Billing Portfolio',
      value: formatRupiah(data.summary.totalBilling),
      helper: 'Akumulasi nominal tagihan',
    },
    {
      title: 'Total Collected Revenue',
      value: formatRupiah(data.summary.totalCollected),
      helper: 'Akumulasi angsuran masuk',
    },
    {
      title: 'Total Accounts Receivable',
      value: formatRupiah(data.summary.totalOutstanding),
      helper: 'Outstanding saldo piutang',
    },
    {
      title: 'Collection Effectiveness Index',
      value: `${data.summary.cei.toFixed(2)}%`,
      helper: 'Collected / billing',
    },
  ];

  const resetInvoiceFilters = () => {
    setCompanyFilter([]);
    setRiskFilter([]);
    setRepaymentFilter([]);
    setPostingStart('');
    setPostingEnd('');
    setMinSaldo('');
    setMaxSaldo('');
    setSortBy('risk_desc');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Laporan Piutang POSTAG</h1>
          <p className="mt-2 text-sm text-slate-600">
            Import billing BKI, normalisasi data pelanggan, dan pantau aging piutang dalam satu dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <ImportExcel onImported={fetchAnalytics} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-2">
          {scorecards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{card.title}</p>
                {card.title.includes('Index') ? (
                  <TrendingUp className="text-teal-600" size={20} />
                ) : (
                  <WalletCards className="text-teal-600" size={20} />
                )}
              </div>
              <p className="break-words text-2xl font-black text-slate-900">{card.value}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{card.helper}</p>
            </article>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm font-bold text-slate-600">Memuat analytics...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-900">Top 10 Debtors</h2>
              <p className="text-xs font-semibold text-slate-500">Perusahaan dengan outstanding saldo piutang tertinggi.</p>
            </div>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.topDebtors.map((item) => ({
                    ...item,
                    label: shortName(item.namaPerusahaan),
                  }))}
                  layout="vertical"
                  margin={{ top: 8, right: 32, bottom: 8, left: 180 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatCompactRupiah} />
                  <YAxis dataKey="label" type="category" width={170} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatRupiah(Number(value))}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.namaPerusahaan || ''}
                  />
                  <Bar dataKey="totalOutstanding" radius={[0, 8, 8, 0]} fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <ChartCard
            title="Credit Risk Portfolio"
            subtitle="Distribusi berdasarkan kategori risiko aging piutang."
            data={riskDistribution}
            colors={RISK_COLORS}
          />

          <ChartCard
            title="Repayment Progression"
            subtitle="Distribusi status pelunasan berdasarkan rasio angsuran terhadap tagihan."
            data={repaymentDistribution}
            colors={REPAYMENT_COLORS}
          />

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Detail Piutang per Perusahaan</h2>
                <p className="text-xs font-semibold text-slate-500">
                  Daftar invoice berdasarkan klasifikasi risiko realtime per hari ini.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari perusahaan, objek, invoice"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 sm:w-72"
                  />
                </div>
                <button
                  type="button"
                  onClick={resetInvoiceFilters}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  Reset Filter
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Nama Perusahaan</label>
                  <AdminFilterDropdown
                    label="Nama Perusahaan"
                    selectedValues={companyFilter}
                    onChange={setCompanyFilter}
                    placeholder="Semua Perusahaan"
                    options={companyOptions}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Klasifikasi Risiko</label>
                  <AdminFilterDropdown
                    label="Klasifikasi Risiko"
                    selectedValues={riskFilter}
                    onChange={setRiskFilter}
                    placeholder="Semua Risiko"
                    options={RISK_FILTERS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Status Pelunasan</label>
                  <AdminFilterDropdown
                    label="Status Pelunasan"
                    selectedValues={repaymentFilter}
                    onChange={setRepaymentFilter}
                    placeholder="Semua Status"
                    options={REPAYMENT_FILTERS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Urutkan</label>
                  <SortDropdown
                    value={sortBy}
                    onChange={setSortBy}
                    options={SORT_OPTIONS}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Posting Dari</label>
                  <input
                    type="date"
                    value={postingStart}
                    onChange={(event) => setPostingStart(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Posting Sampai</label>
                  <input
                    type="date"
                    value={postingEnd}
                    onChange={(event) => setPostingEnd(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Saldo Minimal</label>
                  <input
                    type="number"
                    min="0"
                    value={minSaldo}
                    onChange={(event) => setMinSaldo(event.target.value)}
                    placeholder="0"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500">Saldo Maksimal</label>
                  <input
                    type="number"
                    min="0"
                    value={maxSaldo}
                    onChange={(event) => setMaxSaldo(event.target.value)}
                    placeholder="Tidak dibatasi"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-600">
                {filteredInvoices.length.toLocaleString('id-ID')} invoice cocok
              </p>
              <p className="text-xs font-bold text-slate-700">
                Total saldo filter: <span className="text-teal-700">{formatRupiah(totalFilteredSaldo)}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-xs font-black uppercase text-slate-500">
                    <th className="px-4 py-3">Perusahaan</th>
                    <th className="px-4 py-3">Objek</th>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Posting</th>
                    <th className="px-4 py-3 text-right">Umur</th>
                    <th className="px-4 py-3 text-right">Tagihan</th>
                    <th className="px-4 py-3 text-right">Angsuran</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                    <th className="px-4 py-3">Klasifikasi</th>
                    <th className="px-4 py-3">Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                        Tidak ada invoice untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    pagedInvoices.map((item) => (
                      <tr key={`${item.invoiceNumber}-${item.namaObjek}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{item.namaPerusahaan}</td>
                        <td className="px-4 py-3 text-slate-600">{item.namaObjek}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{item.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.postingDate)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700">{item.agingDays.toLocaleString('id-ID')} hari</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(item.nominalTagihan)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(item.nominalAngsuran)}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">{formatRupiah(item.saldoPiutang)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${riskBadgeClass(item.riskCategory)}`}>
                            {item.riskCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{item.statusPelunasan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">
                Menampilkan {pagedInvoices.length} dari {filteredInvoices.length} invoice
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-slate-600">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  data,
  colors,
}: {
  title: string;
  subtitle: string;
  data: DistributionItem[];
  colors: Record<string, string>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" innerRadius={70} outerRadius={115} paddingAngle={2}>
                {data.map((item) => (
                  <Cell key={item.name} fill={colors[item.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _, payload) => [
                  `${Number(value).toLocaleString('id-ID')} invoice (${formatCompactRupiah(payload.payload.total)})`,
                  payload.payload.name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 self-center">
          {data.map((item) => (
            <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[item.name] || '#64748b' }} />
                <p className="text-xs font-bold text-slate-700">{item.name}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {item.count.toLocaleString('id-ID')} invoice | {formatCompactRupiah(item.total)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SortDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((item) => item.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm shadow-sm transition ${
          isOpen ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="truncate font-semibold text-slate-800">{selected?.label || 'Urutkan'}</span>
        <ChevronDown size={16} className={`ml-2 shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Urutkan Data</p>
          </div>
          <div className="py-1">
            {options.map((item) => {
              const checked = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                    checked ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      checked ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check size={16} strokeWidth={3} />
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
