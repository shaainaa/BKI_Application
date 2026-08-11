"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle,
  ChevronDown,
  Eye,
  FileText,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react';
import AdminFilterDropdown from '@/components/AdminFilterDropdown';

type UserLite = {
  nama?: string;
  email?: string;
};

type TagihanStatus = 'MENUNGGU_EVALUASI' | 'DISETUJUI' | 'PERLU_REVISI' | 'DITOLAK' | 'SELESAI';

type Tagihan = {
  id: number;
  nomorInvoice: string;
  vendor: string;
  kategori: string;
  tanggalInvoice: string;
  tanggalDiterima: string;
  tanggalJatuhTempo?: string | null;
  nominal: string | number;
  keterangan?: string | null;
  invoiceFileUrl: string;
  invoiceFileName: string;
  status: TagihanStatus;
  creator?: UserLite | null;
  evaluator?: UserLite | null;
  evaluatedAt?: string | null;
  evaluationNotes?: string | null;
  tanggalPembayaran?: string | null;
  paymentProofUrl?: string | null;
  paymentProofName?: string | null;
  paymentNotes?: string | null;
  createdAt?: string;
};

const CATEGORIES = [
  'Sewa Menyewa',
  'Tagihan Listrik',
  'Tagihan Air',
  'Koperasi',
  'Cuci Mobil',
  'Kalibrasi Peralatan',
  'Lainnya',
];

const INITIAL_FORM = {
  nomorInvoice: '',
  vendor: '',
  kategori: CATEGORIES[0],
  tanggalInvoice: '',
  tanggalDiterima: new Date().toISOString().slice(0, 10),
  tanggalJatuhTempo: '',
  nominal: '',
  keterangan: '',
};

const STATUS_OPTIONS: TagihanStatus[] = ['MENUNGGU_EVALUASI', 'DISETUJUI', 'PERLU_REVISI', 'DITOLAK', 'SELESAI'];

const DEFAULT_FILTERS = {
  vendor: [] as string[],
  kategori: [] as string[],
  status: [] as string[],
  search: '',
  tanggalInvoiceMulai: '',
  tanggalInvoiceAkhir: '',
};

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Terbaru Diinput' },
  { value: 'created_asc', label: 'Terlama Diinput' },
  { value: 'nominal_desc', label: 'Nominal Terbesar' },
  { value: 'nominal_asc', label: 'Nominal Terkecil' },
  { value: 'vendor_asc', label: 'Vendor A-Z' },
];

export default function AdminTagihanPage() {
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState<Tagihan | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Tagihan | null>(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [evaluationStatus, setEvaluationStatus] = useState<TagihanStatus>('DISETUJUI');
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tagihan', { cache: 'no-store' });
      const result = await res.json();
      if (result.success) {
        setTagihan(result.data || []);
      } else {
        alert(result.message || result.error || 'Gagal memuat tagihan.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat memuat tagihan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagihan();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, pageSize]);

  const filterOptions = useMemo(() => {
    const vendor = Array.from(new Set(tagihan.map((item) => item.vendor).filter(Boolean)));
    const kategori = Array.from(new Set(tagihan.map((item) => item.kategori).filter(Boolean)));

    return { vendor, kategori };
  }, [tagihan]);

  const filteredTagihan = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const isDateInRange = (value: string | null | undefined, start: string, end: string) => {
      if (!start && !end) return true;
      const dateValue = (value || '').slice(0, 10);
      if (!dateValue) return false;
      return (!start || dateValue >= start) && (!end || dateValue <= end);
    };

    const getTime = (value?: string | null, fallback = 0) => {
      const time = new Date(value || '').getTime();
      return Number.isNaN(time) ? fallback : time;
    };

    const rows = tagihan.filter((item) => {
      const haystack = `${item.nomorInvoice} ${item.vendor} ${item.kategori} ${item.keterangan || ''}`.toLowerCase();

      const matchVendor = filters.vendor.length === 0 || filters.vendor.includes(item.vendor);
      const matchKategori = filters.kategori.length === 0 || filters.kategori.includes(item.kategori);
      const matchStatus = filters.status.length === 0 || filters.status.includes(item.status);
      const matchSearch = !normalizedSearch || haystack.includes(normalizedSearch);

      return (
        matchVendor &&
        matchKategori &&
        matchStatus &&
        matchSearch &&
        isDateInRange(item.tanggalInvoice, filters.tanggalInvoiceMulai, filters.tanggalInvoiceAkhir)
      );
    });

    return rows.sort((a, b) => {
      if (sortBy === 'created_asc') return getTime(a.createdAt) - getTime(b.createdAt);
      if (sortBy === 'nominal_desc') return Number(b.nominal || 0) - Number(a.nominal || 0);
      if (sortBy === 'nominal_asc') return Number(a.nominal || 0) - Number(b.nominal || 0);
      if (sortBy === 'vendor_asc') return a.vendor.localeCompare(b.vendor);

      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }, [tagihan, filters, sortBy]);

  const pagedTagihan = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTagihan.slice(start, start + pageSize);
  }, [filteredTagihan, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTagihan.length / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const summary = useMemo(() => {
    const totalNominal = filteredTagihan.reduce((total, item) => total + Number(item.nominal || 0), 0);
    const waiting = filteredTagihan.filter((item) => item.status === 'MENUNGGU_EVALUASI').length;
    const unpaid = filteredTagihan.filter((item) => item.status === 'DISETUJUI').length;
    const done = filteredTagihan.filter((item) => item.status === 'SELESAI').length;

    return { totalNominal, waiting, unpaid, done };
  }, [filteredTagihan]);

  const formatRupiah = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (status: TagihanStatus) => {
    if (status === 'SELESAI') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'DISETUJUI') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'PERLU_REVISI') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'DITOLAK') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoiceFile) {
      alert('File invoice wajib diupload.');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append('invoiceFile', invoiceFile);

      const res = await fetch('/api/admin/tagihan', { method: 'POST', body: payload });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || result.error || 'Gagal menambah tagihan.');
        return;
      }

      setForm({ ...INITIAL_FORM });
      setInvoiceFile(null);
      setShowCreateModal(false);
      await fetchTagihan();
    } catch {
      alert('Terjadi kesalahan jaringan saat menyimpan tagihan.');
    } finally {
      setSaving(false);
    }
  };

  const openEvaluation = (item: Tagihan) => {
    setSelectedTagihan(item);
    setEvaluationStatus(item.status === 'SELESAI' ? 'DISETUJUI' : item.status === 'MENUNGGU_EVALUASI' ? 'DISETUJUI' : item.status);
    setEvaluationNotes(item.evaluationNotes || '');
  };

  const submitEvaluation = async () => {
    if (!selectedTagihan) return;

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('id', String(selectedTagihan.id));
      payload.append('action', 'evaluate');
      payload.append('status', evaluationStatus);
      payload.append('evaluationNotes', evaluationNotes);

      const res = await fetch('/api/admin/tagihan', { method: 'PATCH', body: payload });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || result.error || 'Gagal menyimpan evaluasi.');
        return;
      }

      setSelectedTagihan(null);
      await fetchTagihan();
    } catch {
      alert('Terjadi kesalahan jaringan saat menyimpan evaluasi.');
    } finally {
      setSaving(false);
    }
  };

  const openPayment = (item: Tagihan) => {
    setPaymentTarget(item);
    setPaymentDate(item.tanggalPembayaran || new Date().toISOString().slice(0, 10));
    setPaymentNotes(item.paymentNotes || '');
    setPaymentProof(null);
  };

  const submitPayment = async () => {
    if (!paymentTarget) return;
    if (!paymentDate) {
      alert('Tanggal pembayaran wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('id', String(paymentTarget.id));
      payload.append('action', 'payment');
      payload.append('tanggalPembayaran', paymentDate);
      payload.append('paymentNotes', paymentNotes);
      if (paymentProof) payload.append('paymentProof', paymentProof);

      const res = await fetch('/api/admin/tagihan', { method: 'PATCH', body: payload });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || result.error || 'Gagal menandai pembayaran.');
        return;
      }

      setPaymentTarget(null);
      await fetchTagihan();
    } catch {
      alert('Terjadi kesalahan jaringan saat menyimpan pembayaran.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Tagihan) => {
    const ok = confirm(`Hapus tagihan ${item.nomorInvoice}? File invoice dan bukti pembayaran akan ikut dihapus.`);
    if (!ok) return;

    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/admin/tagihan?id=${item.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || result.error || 'Gagal menghapus tagihan.');
        return;
      }

      await fetchTagihan();
    } catch {
      alert('Terjadi kesalahan jaringan saat menghapus tagihan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 font-sans">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-bold tracking-tight text-[#202c45]">Tagihan Pihak Ketiga</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Rekap invoice vendor dari input sampai pembayaran selesai.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0A8E9A] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus size={18} /> Tambah Tagihan
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Total Tagihan" value={formatRupiah(summary.totalNominal)} color="blue" />
        <SummaryCard label="Menunggu Evaluasi" value={summary.waiting.toLocaleString('id-ID')} color="amber" />
        <SummaryCard label="Belum Dibayar" value={summary.unpaid.toLocaleString('id-ID')} color="rose" />
        <SummaryCard label="Selesai" value={summary.done.toLocaleString('id-ID')} color="emerald" />
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">Filter</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={fetchTagihan}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
              >
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-inner">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">Cari</label>
                <input
                  value={filters.search}
                  onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                  placeholder="No invoice, vendor, kategori"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">Status</label>
                <AdminFilterDropdown
                  label="Status"
                  selectedValues={filters.status}
                  onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  placeholder="Semua Status"
                  options={STATUS_OPTIONS}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">Vendor</label>
                <AdminFilterDropdown
                  label="Vendor"
                  selectedValues={filters.vendor}
                  onChange={(value) => setFilters((prev) => ({ ...prev, vendor: value }))}
                  placeholder="Semua Vendor"
                  options={filterOptions.vendor}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">Kategori</label>
                <AdminFilterDropdown
                  label="Kategori"
                  selectedValues={filters.kategori}
                  onChange={(value) => setFilters((prev) => ({ ...prev, kategori: value }))}
                  placeholder="Semua Kategori"
                  options={filterOptions.kategori}
                />
              </div>
              <FilterDate label="Tanggal Invoice Mulai" value={filters.tanggalInvoiceMulai} onChange={(value) => setFilters((prev) => ({ ...prev, tanggalInvoiceMulai: value }))} />
              <FilterDate label="Tanggal Invoice Akhir" value={filters.tanggalInvoiceAkhir} onChange={(value) => setFilters((prev) => ({ ...prev, tanggalInvoiceAkhir: value }))} />
              <div className="lg:col-span-2">
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">Sort By</label>
                <SortDropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-800">
            <thead className="bg-[#b3c1d1] text-base font-semibold text-[#202c45]">
              <tr className="whitespace-nowrap">
                <th className="rounded-tl-2xl px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-center">Tgl Invoice</th>
                <th className="px-6 py-4 text-center">Jatuh Tempo</th>
                <th className="px-6 py-4 text-center">Nominal</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="rounded-tr-2xl px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-20 text-center text-gray-400">Memproses data tagihan...</td></tr>
              ) : filteredTagihan.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-gray-400">Belum ada tagihan yang cocok.</td></tr>
              ) : (
                pagedTagihan.map((item) => (
                  <tr key={item.id} className="transition hover:bg-gray-50/80">
                    <td className="px-6 py-4 font-black text-gray-900">{item.nomorInvoice}</td>
                    <td className="px-6 py-4 font-semibold">{item.vendor}</td>
                    <td className="px-6 py-4 text-gray-600">{item.kategori}</td>
                    <td className="px-6 py-4 text-center">{formatDate(item.tanggalInvoice)}</td>
                    <td className="px-6 py-4 text-center">{formatDate(item.tanggalJatuhTempo)}</td>
                    <td className="px-6 py-4 text-center font-black text-teal-700 whitespace-nowrap">{formatRupiah(item.nominal)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${getStatusBadge(item.status)}`}>
                        {item.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEvaluation(item)}
                          className="rounded-xl bg-blue-600 p-2 text-white shadow-sm transition hover:bg-blue-700"
                          title="Detail & Evaluasi"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => openPayment(item)}
                          disabled={item.status === 'SELESAI' || item.status === 'DITOLAK' || item.status === 'PERLU_REVISI'}
                          className="rounded-xl bg-emerald-600 p-2 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                          title="Tandai Selesai"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="rounded-xl bg-rose-50 p-2 text-rose-600 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          title="Hapus Tagihan"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-gray-500">
            Menampilkan {pagedTagihan.length} dari {filteredTagihan.length} tagihan
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">Baris</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-600"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-gray-600">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <Modal title="Tambah Tagihan" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Nomor Invoice" value={form.nomorInvoice} onChange={(value) => setForm({ ...form, nomorInvoice: value })} required />
              <Input label="Vendor" value={form.vendor} onChange={(value) => setForm({ ...form, vendor: value })} required />
              <Select label="Kategori" value={form.kategori} onChange={(value) => setForm({ ...form, kategori: value })} options={CATEGORIES} />
              <Input label="Nominal" type="number" value={form.nominal} onChange={(value) => setForm({ ...form, nominal: value })} required />
              <Input label="Tanggal Invoice" type="date" value={form.tanggalInvoice} onChange={(value) => setForm({ ...form, tanggalInvoice: value })} required />
              <Input label="Tanggal Diterima" type="date" value={form.tanggalDiterima} onChange={(value) => setForm({ ...form, tanggalDiterima: value })} required />
              <Input label="Tanggal Jatuh Tempo" type="date" value={form.tanggalJatuhTempo} onChange={(value) => setForm({ ...form, tanggalJatuhTempo: value })} />
              <FileInput label="File Invoice" onChange={setInvoiceFile} />
            </div>
            <Textarea label="Keterangan" value={form.keterangan} onChange={(value) => setForm({ ...form, keterangan: value })} />
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A8E9A] px-4 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
              <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Tagihan'}
            </button>
          </form>
        </Modal>
      )}

      {selectedTagihan && (
        <Modal title="Evaluasi Tagihan" onClose={() => setSelectedTagihan(null)}>
          <div className="space-y-5">
            <InvoiceSnapshot item={selectedTagihan} formatDate={formatDate} formatRupiah={formatRupiah} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Keputusan Evaluasi"
                value={evaluationStatus}
                onChange={(value) => setEvaluationStatus(value as TagihanStatus)}
                options={['DISETUJUI', 'PERLU_REVISI', 'DITOLAK']}
              />
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-gray-500">File Invoice</label>
                <a href={selectedTagihan.invoiceFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-full items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700 hover:bg-blue-100">
                  <Eye size={16} /> Lihat Invoice
                </a>
              </div>
            </div>
            <Textarea label="Catatan Evaluasi" value={evaluationNotes} onChange={setEvaluationNotes} />
            <button onClick={submitEvaluation} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Evaluasi'}
            </button>
          </div>
        </Modal>
      )}

      {paymentTarget && (
        <Modal title="Tandai Selesai" onClose={() => setPaymentTarget(null)}>
          <div className="space-y-5">
            <InvoiceSnapshot item={paymentTarget} formatDate={formatDate} formatRupiah={formatRupiah} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Tanggal Pembayaran" type="date" value={paymentDate} onChange={setPaymentDate} required />
              <FileInput label="Bukti Pembayaran" onChange={setPaymentProof} />
            </div>
            <Textarea label="Catatan Pembayaran" value={paymentNotes} onChange={setPaymentNotes} />
            <button onClick={submitPayment} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
              <CheckCircle size={18} /> {saving ? 'Menyimpan...' : 'Tandai Selesai'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: 'blue' | 'amber' | 'rose' | 'emerald' }) {
  const classes = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  };

  return (
    <div className={`rounded-2xl border px-5 py-4 ${classes[color]}`}>
      <p className="text-[11px] font-black uppercase tracking-wider opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[#0A8E9A]">
            <ReceiptText size={24} />
            <h2 className="text-2xl font-black text-[#202c45]">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-500">
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InvoiceSnapshot({
  item,
  formatDate,
  formatRupiah,
}: {
  item: Tagihan;
  formatDate: (value?: string | null) => string;
  formatRupiah: (value: number | string) => string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <Info label="Invoice" value={item.nomorInvoice} />
        <Info label="Vendor" value={item.vendor} />
        <Info label="Kategori" value={item.kategori} />
        <Info label="Tanggal Invoice" value={formatDate(item.tanggalInvoice)} />
        <Info label="Jatuh Tempo" value={formatDate(item.tanggalJatuhTempo)} />
        <Info label="Nominal" value={formatRupiah(item.nominal)} />
        <Info label="Input Oleh" value={item.creator?.nama || '-'} />
        <Info label="Status" value={item.status.replaceAll('_', ' ')} />
        <Info label="Tanggal Pembayaran" value={formatDate(item.tanggalPembayaran)} />
      </div>
      {item.keterangan && <p className="mt-4 text-sm font-medium text-slate-600">{item.keterangan}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-gray-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-600 outline-none focus:border-teal-500"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  const mappedOptions = options.map((option) => ({ value: option, label: option.replaceAll('_', ' ') }));

  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase text-gray-500">{label}</label>
      <SortDropdown value={value} onChange={onChange} options={mappedOptions} />
    </div>
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
  const selected = options.find((option) => option.value === value)?.label || 'Sort By';

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
          isOpen ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className="truncate font-semibold text-gray-800">{selected}</span>
        <ChevronDown size={16} className={`ml-2 shrink-0 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-full min-w-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50/70'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      active ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-transparent'
                    }`}
                  >
                    <Check size={17} strokeWidth={3} />
                  </span>
                  <span className="font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase text-gray-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[96px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function FileInput({ label, onChange }: { label: string; onChange: (file: File | null) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase text-gray-500">{label}</span>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="block h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-teal-700"
      />
    </label>
  );
}
