"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlignJustify,
  CheckCircle,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Plus,
  Search,
  Send,
  Upload,
  XCircle,
} from 'lucide-react';
import FormPermohonanModal from './form_pds/page';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';

type BuktiKategori = 'SURVEY' | 'FOTO' | 'TRANSPORTASI' | 'PENGINAPAN' | 'LAINNYA';

const BUKTI_KATEGORI_LIST: BuktiKategori[] = ['SURVEY', 'FOTO', 'TRANSPORTASI', 'PENGINAPAN', 'LAINNYA'];

export default function PermohonanPDS() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [opsiLokasi, setOpsiLokasi] = useState<string[]>([]);
  const [opsiKeperluan, setOpsiKeperluan] = useState<string[]>([]);

  const [isLokasiOpen, setIsLokasiOpen] = useState(false);
  const [isKeperluanOpen, setIsKeperluanOpen] = useState(false);
  const [lokasiSearch, setLokasiSearch] = useState('');
  const [keperluanSearch, setKeperluanSearch] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLokasi, setSelectedLokasi] = useState<string[]>([]);
  const [selectedKeperluan, setSelectedKeperluan] = useState<string[]>([]);

  const [previewData, setPreviewData] = useState<any>(null);
  const [uploadPds, setUploadPds] = useState<any>(null);
  const [uploadingKategori, setUploadingKategori] = useState<string>('');
  const [submittingBukti, setSubmittingBukti] = useState(false);

  const fetchInitialData = async (withLoading = true) => {
    if (withLoading) {
      setLoading(true);
    }

    try {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return [];
      const user = JSON.parse(userRaw);

      const resData = await fetch(`/api/pds/list?userId=${user.id}`);
      const resultData = await resData.json();
      const nextTableData = resultData.success ? resultData.data || [] : [];
      setTableData(nextTableData);

      const resFilter = await fetch('/api/pds/filters');
      const resultFilter = await resFilter.json();
      if (resultFilter.success) {
        setOpsiLokasi(resultFilter.lokasi || []);
        setOpsiKeperluan(resultFilter.keperluan || []);
      }

      return nextTableData;
    } catch (err) {
      console.error('Gagal load data:', err);
      return [];
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsLokasiOpen(false);
        setIsKeperluanOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchStatus = selectedStatus === '' || item.status === selectedStatus;
      const matchLokasi = selectedLokasi.length === 0 || selectedLokasi.includes(item.lokasi);
      const matchKeperluan = selectedKeperluan.length === 0 || selectedKeperluan.includes(item.keperluan);
      return matchStatus && matchLokasi && matchKeperluan;
    });
  }, [tableData, selectedStatus, selectedLokasi, selectedKeperluan]);

  const summary = {
    total: tableData.length,
    pending: tableData.filter((i) => i.status === 'PENDING').length,
    approved: tableData.filter((i) => i.status === 'APPROVED').length,
    submitted: tableData.filter((i) => i.status === 'SUBMITTED').length,
    completed: tableData.filter((i) => i.status === 'COMPLETED').length,
  };

  const toggleFilter = (list: string[], setList: any, value: string) => {
    if (list.includes(value)) {
      setList(list.filter((i) => i !== value));
    } else {
      setList([...list, value]);
    }
  };

  const getVerificationLabel = (bukti: any[] = []) => {
    if (!bukti.length) return 'BELUM ADA BUKTI';

    const hasReject = bukti.some((item) => item.verificationStatus === 'DIREJECT');
    if (hasReject) return 'BUKTI DIREJECT';

    const allAccepted = bukti.every((item) => item.verificationStatus === 'DITERIMA');
    if (allAccepted) return 'SEMUA DITERIMA';

    return 'MENUNGGU VERIFIKASI';
  };

  const getOverallReviewNote = (bukti: any[] = []) => {
    const notes = bukti
      .map((item) => (item.verificationNotes || '').trim())
      .filter((note) => Boolean(note));

    if (notes.length === 0) return '';

    return Array.from(new Set(notes)).join('\n\n');
  };

  const handleUploadBukti = async (pdsId: number, kategori: BuktiKategori, file: File) => {
    setUploadingKategori(kategori);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pdsId', pdsId.toString());
    formData.append('kategori', kategori);

    try {
      const res = await fetch('/api/pds/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Gagal upload bukti');
        return;
      }

      const latestTableData = await fetchInitialData(false);
      const latest = (latestTableData || []).find((item: any) => item.id === pdsId);
      setUploadPds(latest || null);

      alert(`${kategori} berhasil diupload.`);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan jaringan saat upload bukti.');
    } finally {
      setUploadingKategori('');
    }
  };

  const handleSubmitBukti = async () => {
    if (!uploadPds?.id) return;

    setSubmittingBukti(true);
    try {
      const res = await fetch('/api/pds/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdsId: uploadPds.id }),
      });
      const result = await res.json();

      if (!result.success) {
        alert(result.message || 'Gagal submit bukti');
        return;
      }

      alert('Bukti berhasil disubmit dan menunggu verifikasi admin.');
      setUploadPds(null);
      await fetchInitialData(false);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan jaringan saat submit bukti.');
    } finally {
      setSubmittingBukti(false);
    }
  };

  const canEditUploadPds = uploadPds?.status === 'APPROVED';
  const overallReviewNote = getOverallReviewNote(uploadPds?.bukti || []);

  return (
    <div className="flex-1 bg-gray-50/50 p-8 min-h-screen font-sans w-full overflow-hidden">
      <h1 className="text-4xl font-bold text-[#1F2937] mb-6 tracking-tight">Permohonan PDS</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Permohonan" count={summary.total} color="pink" icon={<FileText size={20} />} />
        <StatCard title="Menunggu Approval" count={summary.pending} color="orange" icon={<Clock size={20} />} />
        <StatCard title="Siap Upload Bukti" count={summary.approved} color="blue" icon={<Upload size={20} />} />
        <StatCard title="Menunggu Verifikasi" count={summary.submitted} color="yellow" icon={<Send size={20} />} />
        <StatCard title="Selesai" count={summary.completed} color="green" icon={<CheckCircle size={20} />} />
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-[#0A8E9A] hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold mb-8 transition-all shadow-md"
      >
        <Plus size={20} /> Buat Permohonan Baru
      </button>

      <div className="bg-white p-5 rounded-t-2xl border border-gray-200" ref={filterRef}>
        <div className="flex items-center gap-2 mb-4 text-[#0A8E9A]">
          <AlignJustify size={18} />
          <p className="text-sm font-bold uppercase tracking-wider">Filter</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <FilterDropdown
            label="Lokasi"
            isOpen={isLokasiOpen}
            setIsOpen={setIsLokasiOpen}
            searchValue={lokasiSearch}
            setSearchValue={setLokasiSearch}
            options={opsiLokasi}
            selectedOptions={selectedLokasi}
            onToggle={(val: string) => toggleFilter(selectedLokasi, setSelectedLokasi, val)}
            otherDropdownClose={() => setIsKeperluanOpen(false)}
          />

          <FilterDropdown
            label="Keperluan"
            isOpen={isKeperluanOpen}
            setIsOpen={setIsKeperluanOpen}
            searchValue={keperluanSearch}
            setSearchValue={setKeperluanSearch}
            options={opsiKeperluan}
            selectedOptions={selectedKeperluan}
            onToggle={(val: string) => toggleFilter(selectedKeperluan, setSelectedKeperluan, val)}
            otherDropdownClose={() => setIsLokasiOpen(false)}
          />

          <input
            type="date"
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer"
          />
        </div>
      </div>

      <div className="bg-white border-x border-b border-gray-200 shadow-sm overflow-x-auto rounded-b-2xl">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-[#B9C6D3] text-gray-800 text-[13px] tracking-widest whitespace-nowrap">
              <th className="py-4 px-6 font-bold text-center">Tanggal</th>
              <th className="py-4 px-6 font-bold text-center">No. Agenda</th>
              <th className="py-4 px-6 font-bold text-center">Lokasi</th>
              <th className="py-4 px-6 font-bold text-center">Permohonan</th>
              <th className="py-4 px-6 font-bold text-center">Keperluan</th>
              <th className="py-4 px-6 font-bold text-center">Status PDS</th>
              <th className="py-4 px-6 font-bold text-center">Status Bukti</th>
              <th className="py-4 px-6 font-bold text-center">Submit Bukti</th>
              <th className="py-4 px-6 font-bold text-center">Surat</th>
              <th className="py-4 px-6 font-bold text-center">Upload Bukti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-20 text-center text-gray-400">Loading data BKI...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 text-center bg-gray-50">
                  <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-gray-500 italic text-sm">Tidak ada data yang cocok dengan filter.</p>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => {
                const canManageBukti = row.status === 'APPROVED' || (row.bukti || []).length > 0;
                return (
                  <tr key={row.id} className="hover:bg-teal-50/30 transition-colors whitespace-nowrap">
                    <td className="py-4 px-6 text-sm text-gray-600">{new Date(row.tanggalPengajuan).toLocaleDateString('id-ID')}</td>
                    <td className="py-4 px-6 text-sm text-center font-semibold text-gray-700">{row.noAgenda || '-'}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-800">{row.lokasi}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black italic uppercase">{row.permohonan}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 italic max-w-xs overflow-hidden text-ellipsis">{row.keperluan}</td>
                    <td className="py-4 px-6 text-center">
                      <BadgeStatus status={row.status} />
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-semibold text-gray-700">
                      {getVerificationLabel(row.bukti || [])}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 text-center">{row.buktiSubmittedAt ? new Date(row.buktiSubmittedAt).toLocaleString('id-ID') : '-'}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setPreviewData(row)}
                        className="flex items-center gap-1 text-[#0A8E9A] hover:underline font-bold text-xs mx-auto"
                      >
                        <FileText size={14} /> Lihat Detail
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {canManageBukti ? (
                        <button
                          onClick={() => setUploadPds(row)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100"
                        >
                          <Upload size={13} /> {row.status === 'APPROVED' ? 'Upload Bukti' : 'Lihat Bukti'}
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <FormPermohonanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchInitialData(false);
        }}
      />

      {uploadPds && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 sticky top-0">
              <h3 className="font-bold text-gray-800">
                {canEditUploadPds ? 'Form Pengiriman Bukti' : 'Preview Bukti Surveyor'} - No Agenda {uploadPds.noAgenda || '-'}
              </h3>
              <button onClick={() => setUploadPds(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
                <XCircle size={24} className="text-red-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <InfoItem label="Lokasi" value={uploadPds.lokasi} />
                <InfoItem label="Keperluan" value={uploadPds.keperluan} />
                <InfoItem label="No Agenda" value={uploadPds.noAgenda || '-'} />
                <InfoItem label="Status PDS" value={uploadPds.status} />
              </div>

              {overallReviewNote && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase text-rose-700">Catatan Admin</p>
                  <p className="text-sm text-rose-800 mt-1 whitespace-pre-line">{overallReviewNote}</p>
                </div>
              )}

              <div className="space-y-3">
                {BUKTI_KATEGORI_LIST.map((kategori) => {
                  const existingBukti = uploadPds.bukti?.find((item: any) => item.kategori === kategori);
                  return (
                    <div key={kategori} className="border rounded-2xl p-4 bg-gray-50/70">
                      <div className="flex flex-wrap gap-3 items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black text-gray-500 uppercase">{kategori}</p>
                          <p className="text-sm font-semibold text-gray-700">{existingBukti ? 'File tersedia' : 'Belum upload'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Status verifikasi: {existingBukti?.verificationStatus || 'PENDING'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {existingBukti?.fileUrl && (
                            <a
                              href={existingBukti.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100"
                            >
                              <Eye size={13} /> Lihat
                            </a>
                          )}
                          {canEditUploadPds && (
                            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100">
                              {uploadingKategori === kategori ? 'Uploading...' : 'Upload/Ganti'}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  handleUploadBukti(uploadPds.id, kategori, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  onClick={() => setUploadPds(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Tutup
                </button>
                {canEditUploadPds && (
                  <button
                    onClick={handleSubmitBukti}
                    disabled={submittingBukti}
                    className="px-4 py-2 rounded-lg bg-[#0A8E9A] text-white hover:bg-teal-700 font-bold disabled:opacity-60"
                  >
                    {submittingBukti ? 'Mengirim...' : 'Submit Bukti ke Admin'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div className="gap-2 flex items-center">
                <FileText size={20} className="text-[#0A8E9A]" />
                <h3 className="font-bold text-gray-800 italic">Preview Surat Permohonan - {previewData?.noAgenda}</h3>
              </div>
              <button onClick={() => setPreviewData(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors hover:text-gray-700">
                <XCircle size={24} className="text-red-500" />
              </button>
            </div>
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <PdsTemplate data={previewData} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-700 break-words">{value || '-'}</p>
    </div>
  );
}

function FilterDropdown({
  label,
  isOpen,
  setIsOpen,
  searchValue,
  setSearchValue,
  options,
  selectedOptions,
  onToggle,
  otherDropdownClose,
}: any) {
  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          otherDropdownClose();
        }}
        className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-sm transition-all ${
          isOpen ? 'border-teal-500 ring-2 ring-teal-500 bg-white' : 'border-gray-300 text-gray-600 bg-white'
        }`}
      >
        <span>{selectedOptions.length > 0 ? `${label} (${selectedOptions.length})` : label}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-500' : 'text-gray-400'}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 p-3 animate-in fade-in slide-in-from-top-2">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder={`Cari ${label}...`}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs pl-8 outline-none focus:border-teal-500"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar text-xs">
            {options
              .filter((o: string) => o.toLowerCase().includes(searchValue.toLowerCase()))
              .map((opt: string, i: number) => (
                <label key={i} className="flex items-center gap-2 p-2 hover:bg-teal-50 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" className="accent-[#0A8E9A]" checked={selectedOptions.includes(opt)} onChange={() => onToggle(opt)} /> {opt}
                </label>
              ))}
            {options.length === 0 && <p className="text-center text-gray-400 py-2">Tidak ada data</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count, color, icon }: any) {
  const styles: any = {
    pink: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-600', iconBg: 'bg-pink-200' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600', iconBg: 'bg-orange-200' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600', iconBg: 'bg-blue-200' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', iconBg: 'bg-yellow-200' },
    green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600', iconBg: 'bg-green-200' },
  };

  const theme = styles[color] || styles.pink;

  return (
    <div className={`${theme.bg} ${theme.border} p-5 rounded-2xl flex items-center gap-4 border shadow-sm`}>
      <div className={`p-3 rounded-xl ${theme.iconBg} ${theme.text}`}>{icon}</div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 leading-none mt-1">{count}</p>
      </div>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  const cfg: any = {
    PENDING: 'bg-red-50 text-red-600 border-red-200',
    APPROVED: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-green-50 text-green-600 border-green-200',
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${cfg[status] || cfg.PENDING}`}>{status}</span>;
}
