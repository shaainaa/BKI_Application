"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Plus,
  Save,
  X,
  XCircle,
} from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';
import { useSearchParams } from 'next/navigation';

type NominalPart = {
  id: string;
  label: string;
  amount: string;
};

const ADMIN_PDS_CACHE_TTL_MS = 15000;
let adminPdsCache: any[] | null = null;
let adminPdsCacheAt = 0;
let adminPdsInFlight: Promise<any[] | null> | null = null;

export default function AdminPersetujuanPDS() {
  const searchParams = useSearchParams();
  const [listPds, setListPds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPds, setSelectedPds] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState<any>({
    noAgenda: '',
    lokasi: '',
    keperluan: '',
    tglBerangkat: '',
    jamBerangkat: '',
    tglKembali: '',
    jamKembali: '',
    visitKe: '',
    keteranganVisit: 'PROGRESS',
    sps: '',
    so: '',
    nomorPdsTrans: '',
  });

  const [nominalParts, setNominalParts] = useState<NominalPart[]>([{ id: 'default', label: 'Nominal Utama', amount: '' }]);
  const [buktiDraft, setBuktiDraft] = useState<any[]>([]);
  const [verificationDecision, setVerificationDecision] = useState<'DITERIMA' | 'DIREJECT' | ''>('');
  const [isAcceptedLocked, setIsAcceptedLocked] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const [filters, setFilters] = useState({
    nama: '',
    lokasi: '',
    permohonan: '',
    tanggal: '',
    keperluan: '',
    status: '',
  });

  const fetchAllPds = async ({ silent = false, force = false }: { silent?: boolean; force?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const now = Date.now();
      const cacheStillFresh = adminPdsCache && now - adminPdsCacheAt < ADMIN_PDS_CACHE_TTL_MS;

      if (!force && cacheStillFresh) {
        setListPds(adminPdsCache || []);
        return;
      }

      if (!force && adminPdsInFlight) {
        const sharedData = await adminPdsInFlight;
        if (sharedData) {
          setListPds(sharedData);
        }
        return;
      }

      adminPdsInFlight = (async () => {
        const res = await fetch('/api/admin/pds', { cache: 'no-store' });
        const result = await res.json();
        if (!result.success) return null;

        const rows = result.data || [];
        adminPdsCache = rows;
        adminPdsCacheAt = Date.now();
        return rows;
      })();

      const rows = await adminPdsInFlight;
      if (rows) {
        setListPds(rows);
      }
    } catch (err) {
      console.error('Gagal mengambil data admin:', err);
    } finally {
      adminPdsInFlight = null;
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAllPds();
  }, []);

  useEffect(() => {
    const statusParam = (searchParams.get('status') || '').toUpperCase();
    const allowedStatus = ['PENDING', 'APPROVED', 'SUBMITTED', 'COMPLETED'];

    if (allowedStatus.includes(statusParam)) {
      setFilters((prev) => ({ ...prev, status: statusParam }));
      return;
    }

    setFilters((prev) => ({ ...prev, status: '' }));
  }, [searchParams]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateInput = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const filterOptions = useMemo(() => {
    const nama = Array.from(new Set(listPds.map((item: any) => item.user?.nama || item.user?.name).filter(Boolean)));
    const lokasi = Array.from(new Set(listPds.map((item: any) => item.lokasi).filter(Boolean)));
    const permohonan = Array.from(new Set(listPds.map((item: any) => item.permohonan).filter(Boolean)));
    const keperluan = Array.from(new Set(listPds.map((item: any) => item.keperluan).filter(Boolean)));

    return { nama, lokasi, permohonan, keperluan };
  }, [listPds]);

  const filteredPds = useMemo(() => {
    return listPds.filter((item: any) => {
      const namaUser = (item.user?.nama || item.user?.name || '').toLowerCase();
      const lokasi = (item.lokasi || '').toLowerCase();
      const permohonan = (item.permohonan || '').toLowerCase();
      const keperluan = (item.keperluan || '').toLowerCase();
      const status = (item.status || '').toUpperCase();
      const itemDate = formatDateInput(item.tanggalPengajuan);

      const matchNama = !filters.nama || namaUser === filters.nama.toLowerCase();
      const matchLokasi = !filters.lokasi || lokasi === filters.lokasi.toLowerCase();
      const matchPermohonan = !filters.permohonan || permohonan === filters.permohonan.toLowerCase();
      const matchTanggal = !filters.tanggal || itemDate === filters.tanggal;
      const matchKeperluan = !filters.keperluan || keperluan === filters.keperluan.toLowerCase();
      const matchStatus = !filters.status || status === filters.status;

      return matchNama && matchLokasi && matchPermohonan && matchTanggal && matchKeperluan && matchStatus;
    });
  }, [listPds, filters]);

  const openManageModal = (pds: any) => {
    setSelectedPds(pds);
    setEditForm({
      noAgenda: pds.noAgenda || '',
      lokasi: pds.lokasi || '',
      keperluan: pds.keperluan || '',
      tglBerangkat: formatDateInput(pds.tglBerangkat),
      jamBerangkat: pds.jamBerangkat || '',
      tglKembali: formatDateInput(pds.tglKembali),
      jamKembali: pds.jamKembali || '',
      visitKe: pds.visitKe || '',
      keteranganVisit: pds.keteranganVisit || 'PROGRESS',
      sps: pds.sps || '',
      so: pds.so || '',
      nomorPdsTrans: pds.nomorPdsTrans || '',
    });

    setNominalParts([
      {
        id: 'default',
        label: 'Nominal Utama',
        amount: pds.nominalPDS ? String(pds.nominalPDS) : '',
      },
    ]);

    const buktiList = (pds.bukti || []).map((item: any) => ({
      id: item.id,
      kategori: item.kategori,
      fileUrl: item.fileUrl,
      namaFile: item.namaFile,
    }));

    setBuktiDraft(buktiList);

    const existingStatuses = (pds.bukti || [])
      .map((item: any) => item.verificationStatus)
      .filter((value: string) => value === 'DITERIMA' || value === 'DIREJECT');

    const acceptedLocked = existingStatuses.length > 0 && existingStatuses.every((status: string) => status === 'DITERIMA');
    setIsAcceptedLocked(acceptedLocked);

    if (existingStatuses.length === 0) {
      setVerificationDecision('');
    } else if (existingStatuses.some((status: string) => status === 'DIREJECT')) {
      setVerificationDecision('DIREJECT');
    } else if (existingStatuses.every((status: string) => status === 'DITERIMA')) {
      setVerificationDecision('DITERIMA');
    } else {
      setVerificationDecision('');
    }

    setReviewNotes((pds.bukti || []).find((item: any) => item.verificationNotes)?.verificationNotes || '');

    setIsModalOpen(true);
  };

  const totalNominal = useMemo(() => {
    return nominalParts.reduce((acc, part) => acc + (Number(part.amount) || 0), 0);
  }, [nominalParts]);

  const handleApproveAwal = async (id: number) => {
    if (!confirm('Setujui permohonan ini? Surveyor akan mendapat akses upload bukti.')) return;
    try {
      const res = await fetch('/api/admin/pds', {
        method: 'PATCH',
        body: JSON.stringify({ id, status: 'APPROVED' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || 'Gagal memperbarui status.');
        return;
      }
      await fetchAllPds({ force: true });
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const handleSaveVerifikasi = async () => {
    if (!selectedPds?.id) return;

    setIsSaving(true);
    try {
      const admin = JSON.parse(localStorage.getItem('user') || '{}');

      if (isAcceptedLocked && verificationDecision === 'DIREJECT') {
        alert('Verifikasi yang sudah DITERIMA tidak bisa diubah menjadi DIREJECT.');
        return;
      }

      if (!verificationDecision) {
        alert('Pilih keputusan verifikasi untuk keseluruhan bukti terlebih dahulu.');
        return;
      }

      const hasRejected = verificationDecision === 'DIREJECT';

      if (hasRejected && !reviewNotes.trim()) {
        alert('Catatan wajib diisi jika ada bukti yang direject.');
        return;
      }

      const payload = {
        id: selectedPds.id,
        status: hasRejected ? 'APPROVED' : 'SUBMITTED',
        reviewNotes: reviewNotes.trim(),
        buktiUpdates: buktiDraft.map((item) => ({
          id: item.id,
          verificationStatus: verificationDecision,
          verifiedBy: admin.id || null,
        })),
      };

      const res = await fetch('/api/admin/pds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!result.success) {
        alert(result.error || 'Gagal simpan verifikasi bukti.');
        return;
      }

      alert(hasRejected
        ? 'Verifikasi tersimpan. Data direject dan surveyor bisa edit bukti lagi.'
        : 'Verifikasi bukti berhasil disimpan.');
      await fetchAllPds({ force: true });
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!selectedPds?.id) return;

    if (verificationDecision !== 'DITERIMA') {
      alert('Tidak bisa menyelesaikan PDS karena masih ada bukti yang belum DITERIMA.');
      return;
    }

    setIsSaving(true);
    try {
      const admin = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        id: selectedPds.id,
        status: 'COMPLETED',
        nominal: totalNominal,
        sps: editForm.sps,
        so: editForm.so,
        nomorPdsTrans: editForm.nomorPdsTrans,
        noAgenda: editForm.noAgenda,
        lokasi: editForm.lokasi,
        keperluan: editForm.keperluan,
        tglBerangkat: editForm.tglBerangkat,
        jamBerangkat: editForm.jamBerangkat,
        tglKembali: editForm.tglKembali,
        jamKembali: editForm.jamKembali,
        visitKe: editForm.visitKe,
        keteranganVisit: editForm.keteranganVisit,
        reviewNotes: reviewNotes.trim(),
        buktiUpdates: buktiDraft.map((item) => ({
          id: item.id,
          verificationStatus: 'DITERIMA',
          verifiedBy: admin.id || null,
        })),
      };

      const res = await fetch('/api/admin/pds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!result.success) {
        alert(result.error || 'Gagal menyelesaikan data.');
        return;
      }

      alert('Data berhasil disimpan dan status menjadi COMPLETED.');
      setIsModalOpen(false);
      setSelectedPds(null);
      await fetchAllPds({ force: true });
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  const getBuktiSummary = (bukti: any[] = []) => {
    if (!bukti.length) return { label: 'Belum Upload', className: 'bg-gray-100 text-gray-600 border-gray-200' };

    const statuses = bukti
      .map((item) => String(item?.verificationStatus || '').toUpperCase().trim())
      .filter(Boolean);

    const hasReject = statuses.some((status) => status === 'DIREJECT');
    if (hasReject) return { label: 'Perlu Revisi', className: 'bg-rose-50 text-rose-700 border-rose-200' };

    const allAccepted = statuses.length > 0 && statuses.every((status) => status === 'DITERIMA');
    if (allAccepted) return { label: 'Disetujui', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

    return { label: 'Menunggu Verifikasi', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  return (
    <div className="p-8 bg-[#f8f9fa] min-h-screen font-sans">
      <h1 className="text-[40px] font-bold text-[#202c45] mb-8 tracking-tight">Persetujuan PDS</h1>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <p className="font-semibold text-gray-700 mb-3 text-sm">Filter</p>
          <div className="flex gap-4 flex-wrap">
            <select value={filters.nama} onChange={(e) => setFilters((prev) => ({ ...prev, nama: e.target.value }))} className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none">
              <option value="">Semua Nama</option>
              {filterOptions.nama.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.lokasi} onChange={(e) => setFilters((prev) => ({ ...prev, lokasi: e.target.value }))} className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none">
              <option value="">Semua Lokasi</option>
              {filterOptions.lokasi.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.permohonan} onChange={(e) => setFilters((prev) => ({ ...prev, permohonan: e.target.value }))} className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none">
              <option value="">Semua Jenis</option>
              {filterOptions.permohonan.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input type="date" value={filters.tanggal} onChange={(e) => setFilters((prev) => ({ ...prev, tanggal: e.target.value }))} className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] text-gray-600 outline-none focus:border-teal-500" />
            <select value={filters.keperluan} onChange={(e) => setFilters((prev) => ({ ...prev, keperluan: e.target.value }))} className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none">
              <option value="">Semua Keperluan</option>
              {filterOptions.keperluan.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none">
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="COMPLETED">Complete</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-sm text-gray-800 border-collapse">
            <thead className="bg-[#b3c1d1] text-[#202c45] text-base font-semibold">
              <tr className="whitespace-nowrap">
                <th className="py-4 px-6 rounded-tl-2xl">Nama Surveyor</th>
                <th className="py-4 px-6">Lokasi</th>
                <th className="py-4 px-6 text-center">Tanggal</th>
                <th className="py-4 px-6 text-center">Jenis</th>
                <th className="py-4 px-6">Keperluan</th>
                <th className="py-4 px-6 text-center">No. Agenda</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Verifikasi Bukti</th>
                <th className="py-4 px-6 rounded-tr-2xl text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-20 text-gray-400">Memproses data BKI...</td></tr>
              ) : filteredPds.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-20 text-gray-400">Tidak ada data yang cocok dengan filter.</td></tr>
              ) : (
                filteredPds.map((data: any) => {
                  const buktiStatus = getBuktiSummary(data.bukti || []);
                  return (
                    <tr key={data.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">{data.user?.nama || data.user?.name}</td>
                      <td className="py-4 px-6 uppercase font-medium">{data.lokasi}</td>
                      <td className="py-4 px-6 text-center">{formatDate(data.tanggalPengajuan)}</td>
                      <td className="py-4 px-6 text-center uppercase">{data.permohonan || 'PDS'}</td>
                      <td className="py-4 px-6 max-w-[200px] truncate uppercase italic text-gray-500">{data.keperluan}</td>
                      <td className="py-4 px-6 text-center font-semibold text-gray-700">{data.noAgenda || '-'}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${
                          data.status === 'PENDING'
                            ? 'bg-red-50 text-red-600'
                            : data.status === 'APPROVED'
                            ? 'bg-yellow-50 text-yellow-700'
                            : data.status === 'SUBMITTED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-green-50 text-teal-700'
                        }`}>
                          {data.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${buktiStatus.className}`}>
                          {buktiStatus.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setPreviewData(data)} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all shadow-sm" title="Lihat Surat">
                            <FileText size={18} />
                          </button>
                          {data.status === 'PENDING' && (
                            <button onClick={() => handleApproveAwal(data.id)} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-md" title="Approve awal">
                              <Check size={18} />
                            </button>
                          )}
                          {(data.status === 'APPROVED' || data.status === 'SUBMITTED' || data.status === 'COMPLETED') && (
                            <button onClick={() => openManageModal(data)} className="p-2 bg-[#008cff] text-white rounded-xl hover:bg-blue-600 shadow-md" title="Verifikasi & Edit">
                              <Edit size={18} />
                            </button>
                          )}
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

      {isModalOpen && selectedPds && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-6xl shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500">
              <XCircle size={30} />
            </button>

            <h2 className="text-2xl font-black text-[#0A8E9A] mb-6 border-b border-gray-100 pb-3">Verifikasi Bukti & Finalisasi PDS</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Verifikasi Bukti Surveyor</h3>
                {buktiDraft.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">Belum ada bukti diupload surveyor.</div>
                )}
                {buktiDraft.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 p-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black text-gray-400 uppercase">{item.kategori}</p>
                        <p className="text-sm font-semibold text-gray-700">{item.namaFile || 'File bukti'}</p>
                      </div>
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
                        <Eye size={14} /> Lihat
                      </a>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase text-gray-500 mb-2">Keputusan Verifikasi Keseluruhan Bukti</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 cursor-pointer">
                      <input
                        type="radio"
                        name="overall-verification"
                        checked={verificationDecision === 'DITERIMA'}
                        onChange={() => setVerificationDecision('DITERIMA')}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      Diterima
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 cursor-pointer">
                      <input
                        type="radio"
                        name="overall-verification"
                        checked={verificationDecision === 'DIREJECT'}
                        onChange={() => setVerificationDecision('DIREJECT')}
                        disabled={isAcceptedLocked}
                        className="h-4 w-4 accent-rose-600"
                      />
                      Direject
                    </label>
                  </div>
                  {isAcceptedLocked && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Bukti sudah disetujui. Keputusan tidak bisa diubah ke Direject.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Catatan Verifikasi (1 Form Submit)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full min-h-[90px] border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Tulis catatan umum verifikasi. Wajib jika keputusan keseluruhan DIREJECT."
                  />
                </div>

                <button
                  onClick={handleSaveVerifikasi}
                  disabled={isSaving || buktiDraft.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold px-4 py-3 hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={18} /> Kirim Hasil Verifikasi
                </button>
              </div>

              <div className="space-y-4 bg-teal-50/40 p-6 rounded-2xl border border-teal-100">
                <h3 className="font-bold text-teal-800 text-sm uppercase tracking-wider">Edit Data PDS & Administrasi</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input label="No. Agenda" value={editForm.noAgenda} onChange={(val) => setEditForm({ ...editForm, noAgenda: val })} />
                  <Input label="Lokasi" value={editForm.lokasi} onChange={(val) => setEditForm({ ...editForm, lokasi: val.toUpperCase() })} />
                  <Input label="Keperluan" value={editForm.keperluan} onChange={(val) => setEditForm({ ...editForm, keperluan: val.toUpperCase() })} />
                  <Input label="Visit Ke" value={String(editForm.visitKe || '')} onChange={(val) => setEditForm({ ...editForm, visitKe: val })} />
                  <Input type="date" label="Tgl Berangkat" value={editForm.tglBerangkat} onChange={(val) => setEditForm({ ...editForm, tglBerangkat: val })} />
                  <Input type="time" label="Jam Berangkat" value={editForm.jamBerangkat} onChange={(val) => setEditForm({ ...editForm, jamBerangkat: val })} />
                  <Input type="date" label="Tgl Kembali" value={editForm.tglKembali} onChange={(val) => setEditForm({ ...editForm, tglKembali: val })} />
                  <Input type="time" label="Jam Kembali" value={editForm.jamKembali} onChange={(val) => setEditForm({ ...editForm, jamKembali: val })} />
                  <Input label="No. SPS" value={editForm.sps} onChange={(val) => setEditForm({ ...editForm, sps: val })} />
                  <Input label="No. SO" value={editForm.so} onChange={(val) => setEditForm({ ...editForm, so: val })} />
                  <Input label="No. PDS/Transport" value={editForm.nomorPdsTrans} onChange={(val) => setEditForm({ ...editForm, nomorPdsTrans: val })} />
                  <div>
                    <label className="text-[11px] font-bold uppercase text-teal-700">Keterangan Visit</label>
                    <select value={editForm.keteranganVisit} onChange={(e) => setEditForm({ ...editForm, keteranganVisit: e.target.value })} className="w-full mt-1 bg-white border border-teal-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="PROGRESS">PROGRESS</option>
                      <option value="FINAL">FINAL</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-teal-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-teal-700">Kalkulator Nominal</h4>
                    <button
                      onClick={() => setNominalParts((prev) => [...prev, { id: `${Date.now()}`, label: '', amount: '' }])}
                      className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-2 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50"
                    >
                      <Plus size={13} /> Tambah
                    </button>
                  </div>

                  {nominalParts.map((part, idx) => (
                    <div key={part.id} className="grid grid-cols-12 gap-2">
                      <input
                        value={part.label}
                        onChange={(e) => {
                          const clone = [...nominalParts];
                          clone[idx].label = e.target.value;
                          setNominalParts(clone);
                        }}
                        placeholder="Nama komponen"
                        className="col-span-7 border border-gray-300 rounded-lg px-3 py-2 text-xs"
                      />
                      <input
                        type="number"
                        value={part.amount}
                        onChange={(e) => {
                          const clone = [...nominalParts];
                          clone[idx].amount = e.target.value;
                          setNominalParts(clone);
                        }}
                        placeholder="0"
                        className="col-span-4 border border-gray-300 rounded-lg px-3 py-2 text-xs"
                      />
                      <button
                        onClick={() => setNominalParts((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={nominalParts.length === 1}
                        className="col-span-1 rounded-lg border border-rose-200 text-rose-500 text-xs hover:bg-rose-50 disabled:opacity-40"
                      >
                        <X size={14} className="mx-auto" />
                      </button>
                    </div>
                  ))}

                  <div className="text-sm font-black text-teal-700">Total: Rp {new Intl.NumberFormat('id-ID').format(totalNominal)}</div>
                </div>

                <button
                  onClick={handleSaveAndComplete}
                  disabled={isSaving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A8E9A] text-white font-bold px-4 py-4 hover:bg-teal-700 disabled:opacity-60"
                >
                  <CheckCircle size={19} /> Simpan & Selesaikan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <div className="gap-3 flex items-center text-[#0A8E9A]">
                <FileText size={24} />
                <h3 className="font-bold text-gray-800 italic text-xl tracking-tight uppercase">Arsip Surat Permohonan</h3>
              </div>
              <button onClick={() => setPreviewData(null)}><XCircle size={30} className="text-red-500" /></button>
            </div>
            <div className="flex-1"><PDFViewer width="100%" height="100%" showToolbar={true}><PdsTemplate data={previewData} /></PDFViewer></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase text-teal-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-white border border-teal-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );
}
