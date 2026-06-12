"use client";

import React, { useEffect, useMemo, useState } from 'react';
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
import { AlertCircle, Loader2, RefreshCw, TrendingUp, WalletCards } from 'lucide-react';
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

type AnalyticsData = {
  summary: Summary;
  topDebtors: TopDebtor[];
  riskDistribution: DistributionItem[];
  repaymentDistribution: DistributionItem[];
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

export default function LaporanPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
