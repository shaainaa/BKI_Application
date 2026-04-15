"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, FileText, Edit, Calendar, ChevronDown, Search, CheckCircle, Clock, AlertCircle, AlignJustify, XCircle, Upload, Edit2, Eye } from 'lucide-react'; // Tambahkan 'Upload' disini
import FormPermohonanModal from './form_pds/page';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';

export default function PermohonanPDS() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Table (Dibuat kosong untuk sementara, nanti akan diisi dengan data dari database)
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Filter Dinamis dari Database
  const [opsiLokasi, setOpsiLokasi] = useState<string[]>([]);
  const [opsiKeperluan, setOpsiKeperluan] = useState<string[]>([]);
  
  // States untuk UI Dropdown
  const [isLokasiOpen, setIsLokasiOpen] = useState(false);
  const [isKeperluanOpen, setIsKeperluanOpen] = useState(false);
  const [lokasiSearch, setLokasiSearch] = useState('');
  const [keperluanSearch, setKeperluanSearch] = useState('');

  // States untuk Nilai Filter yang Dipilih
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLokasi, setSelectedLokasi] = useState<string[]>([]);
  const [selectedKeperluan, setSelectedKeperluan] = useState<string[]>([]);

  // State untuk generate Permohonan PDS
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return;
      const user = JSON.parse(userRaw);

      // 1. Ambil Data Table
      const resData = await fetch(`/api/pds/list?userId=${user.id}`);
      const resultData = await resData.json();
      if (resultData.success) setTableData(resultData.data);

      // 2. Ambil Opsi Filter Unik dari Database
      const resFilter = await fetch('/api/pds/filters');
      const resultFilter = await resFilter.json();
      if (resultFilter.success) {
        setOpsiLokasi(resultFilter.lokasi);
        setOpsiKeperluan(resultFilter.keperluan);
      }
    } catch (err) {
      console.error("Gagal load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Logika Menutup Dropdown saat klik di luar
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsLokasiOpen(false);
        setIsKeperluanOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIKA FILTERING TABEL (REAL-TIME) ---
  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      const matchStatus = selectedStatus === '' || item.status === selectedStatus;
      const matchLokasi = selectedLokasi.length === 0 || selectedLokasi.includes(item.lokasi);
      const matchKeperluan = selectedKeperluan.length === 0 || selectedKeperluan.includes(item.keperluan);
      return matchStatus && matchLokasi && matchKeperluan;
    });
  }, [tableData, selectedStatus, selectedLokasi, selectedKeperluan]);

  // Summary Card Data
  const summary = {
    total: tableData.length,
    pending: tableData.filter(i => i.status === 'PENDING').length,
    approved: tableData.filter(i => i.status === 'APPROVED').length,
    completed: tableData.filter(i => i.status === 'COMPLETED').length,
  };

  const toggleFilter = (list: string[], setList: any, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(i => i !== value));
    } else {
      setList([...list, value]);
    }
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-8 min-h-screen font-sans w-full overflow-hidden">
      <h1 className="text-4xl font-bold text-[#1F2937] mb-6 tracking-tight">Permohonan PDS</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Permohonan" count={summary.total} color="pink" icon={<FileText size={20}/>} />
        <StatCard title="Menunggu Approval" count={summary.pending} color="orange" icon={<Clock size={20}/>} />
        {/* Mengubah title Card Ungu menjadi "Upload Bukti" */}
        <StatCard title="Upload Bukti" count={summary.approved} color="purple" icon={<Edit size={20}/>} />
        <StatCard title="Selesai" count={summary.completed} color="green" icon={<CheckCircle size={20}/>} />
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-[#0A8E9A] hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold mb-8 transition-all shadow-md"
      >
        <Plus size={20} /> Buat Permohonan Baru
      </button>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-t-2xl border border-gray-200" ref={filterRef}>
        <div className="flex items-center gap-2 mb-4 text-[#0A8E9A]">
          <AlignJustify size={18} />
          <p className="text-sm font-bold uppercase tracking-wider">Filter</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Filter Status */}
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Custom Dropdown Lokasi */}
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

          {/* Custom Dropdown Keperluan */}
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

          <input type="date" className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer" />
        </div>
      </div>

      {/* Table Section - Ditambahkan overflow-x-auto agar bisa di-scroll horizontal */}
      <div className="bg-white border-x border-b border-gray-200 shadow-sm overflow-x-auto rounded-b-2xl">
        {/* Tambahkan min-w-max agar tabel mau melebar ke kanan */}
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            {/* Tambahkan whitespace-nowrap agar judul kolom tidak turun ke bawah */}
            <tr className="bg-[#B9C6D3] text-gray-800 text-[13px] tracking-widest whitespace-nowrap">
              <th className="py-4 px-6 font-bold text-center">Tanggal</th>
              <th className="py-4 px-6 font-bold text-center">No. Agenda</th>
              <th className="py-4 px-6 font-bold text-center">Lokasi</th>
              <th className="py-4 px-6 font-bold text-center">Permohonan</th>
              <th className="py-4 px-6 font-bold text-center">Keperluan</th>
              <th className="py-4 px-6 font-bold text-center">Status</th>
              <th className="py-4 px-6 font-bold text-center">Surat</th>
              <th className="py-4 px-6 font-bold text-center">Bukti Survey</th>
              <th className="py-4 px-6 font-bold text-center">Bukti Transportasi</th>
              <th className="py-4 px-6 font-bold text-center">Bukti Penginapan</th>
              <th className="py-4 px-6 font-bold text-center">Bukti Lainnya</th>
              <th className="py-4 px-6 font-bold text-center">Updated At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={12} className="py-20 text-center text-gray-400">Loading data BKI...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-20 text-center bg-gray-50">
                  <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-gray-500 italic text-sm">Tidak ada data yang cocok dengan filter.</p>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-teal-50/30 transition-colors whitespace-nowrap">
                  <td className="py-4 px-6 text-sm text-gray-600">{new Date(row.tanggalPengajuan).toLocaleDateString('id-ID')}</td>
                  <td className="py-4 px-6 text-sm text-center font-semibold text-gray-700">{row.noAgenda || '-'}</td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-800">{row.lokasi}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black italic uppercase">{row.permohonan}</span>
                  </td>
                  {/* Menghapus truncate agar tabel bisa meluas secara horizontal */}
                  <td className="py-4 px-6 text-sm text-gray-500 italic max-w-xs overflow-hidden text-ellipsis">{row.keperluan}</td>
                  <td className="py-4 px-6 text-center">
                    <BadgeStatus status={row.status} />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => setPreviewData(row)}
                      className="flex items-center gap-1 text-[#0A8E9A] hover:underline font-bold text-xs mx-auto"
                    >
                      <FileText size={14} /> Lihat Detail
                    </button>
                  </td>
                  
                  {/* --- BAGIAN UPLOAD BUKTI --- */}
                  <td className="py-4 px-6 text-center">
                    <TombolUpload status={row.status} 
                    pdsId={row.id} 
                    kategori="SURVEY" 
                    existingBukti={row.bukti?.find((b: any) => b.kategori === 'SURVEY')}
                    onUploadSuccess={fetchInitialData}/>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <TombolUpload status={row.status} 
                    pdsId={row.id} 
                    kategori="TRANSPORTASI" 
                    existingBukti={row.bukti?.find((b: any) => b.kategori === 'TRANSPORTASI')}
                    onUploadSuccess={fetchInitialData} />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <TombolUpload status={row.status} 
                    pdsId={row.id} 
                    kategori="PENGINAPAN" 
                    existingBukti={row.bukti?.find((b: any) => b.kategori === 'PENGINAPAN')}
                    onUploadSuccess={fetchInitialData} />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <TombolUpload status={row.status} 
                    pdsId={row.id} 
                    kategori="LAINNYA" 
                    existingBukti={row.bukti?.find((b: any) => b.kategori === 'LAINNYA')}
                    onUploadSuccess={fetchInitialData} />
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 text-center">
                    {row.bukti && row.bukti.length > 0
                      ? new Date(Math.max(...row.bukti.map((b: any) => new Date(b.updatedAt).getTime()))).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'} 
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FormPermohonanModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchInitialData(); }} />

      {previewData && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6'>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className='p-4 border-b flex justify-between items-center bg-gray-50'>
              <div className='gap-2 flex items-center'> 
                <FileText size={20} className='text-[#0A8E9A]' />
                <h3 className="font-bold text-gray-800 italic">Preview Surat Permohonan - {previewData?.noAgenda}</h3>
              </div>
              <button onClick={() => setPreviewData(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors hover:text-gray-700">
                <XCircle size={24} className='text-red-500' />
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

// --- SUB-KOMPONEN REUSABLE ---

// Komponen Khusus Tombol Upload Bukti
function TombolUpload({ status, pdsId, kategori, existingBukti, onUploadSuccess }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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

      if (data.success) {
        // Tampilkan pesan berbeda tergantung ini upload baru atau edit
        alert(existingBukti ? `${kategori} berhasil diperbarui!` : `${kategori} berhasil diupload!`);
        onUploadSuccess();
      } else {
        alert(`Gagal: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  if (status !== 'APPROVED') {
    return <span className="text-gray-300 text-xs">-</span>;
  }

  // JIKA FILE SUDAH ADA: Tampilkan tombol Lihat dan tombol Edit
  if (existingBukti) {
    return (
      <div className="flex items-center justify-center gap-2">
        {/* Tombol Lihat Bukti (Buka di tab baru) */}
        <a 
          href={existingBukti.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 transition-colors text-xs font-bold"
        >
          <Eye size={14} /> Lihat
        </a>
        
        {/* Tombol Ganti File (Timpa file lama) */}
        <label className="cursor-pointer flex items-center justify-center p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors" title="Ganti File">
          {isUploading ? (
            <span className="text-[10px] animate-pulse">...</span>
          ) : (
            <Edit2 size={14} />
          )}
          <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
        </label>
      </div>
    );
  }

  // JIKA FILE BELUM ADA: Tampilkan tombol Upload biasa
  return (
    <label className={`cursor-pointer flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border transition-colors text-xs font-bold w-max mx-auto
      ${isUploading ? 'bg-gray-100 text-gray-500 border-gray-300' : 'text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200'}
    `}>
      {isUploading ? (
        <span>Uploading...</span>
      ) : (
        <>
          <Upload size={14} /> Upload Bukti
          <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
        </>
      )}
    </label>
  );
}

function FilterDropdown({ label, isOpen, setIsOpen, searchValue, setSearchValue, options, selectedOptions, onToggle, otherDropdownClose }: any) {
  return (
    <div className="relative">
      <button 
        onClick={() => { setIsOpen(!isOpen); otherDropdownClose(); }}
        className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-sm transition-all ${isOpen ? 'border-teal-500 ring-2 ring-teal-500 bg-white' : 'border-gray-300 text-gray-600 bg-white'}`}
      >
        <span>{selectedOptions.length > 0 ? `${label} (${selectedOptions.length})` : label}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-500' : 'text-gray-400'}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 p-3 animate-in fade-in slide-in-from-top-2">
          <div className="relative mb-3">
            <input 
              type="text" placeholder={`Cari ${label}...`} 
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs pl-8 outline-none focus:border-teal-500"
              value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
            />
            <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar text-xs">
            {options.filter((o: string) => o.toLowerCase().includes(searchValue.toLowerCase())).map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2 p-2 hover:bg-teal-50 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  className="accent-[#0A8E9A]" 
                  checked={selectedOptions.includes(opt)}
                  onChange={() => onToggle(opt)}
                /> {opt}
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
  // Cara penulisan objek untuk menentukan kelas warna diganti agar spesifik menunjuk border lebih gelap
  const styles: any = {
    pink: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-600", iconBg: "bg-pink-200" },
    orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-600", iconBg: "bg-orange-200" },
    purple: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-600", iconBg: "bg-purple-200" },
    green: { bg: "bg-green-50", border: "border-green-300", text: "text-green-600", iconBg: "bg-green-200" },
  };
  
  const theme = styles[color] || styles.pink;

  return (
    // Memasukkan style dinamis ke template string
    <div className={`${theme.bg} ${theme.border} p-5 rounded-2xl flex items-center gap-4 border shadow-sm`}>
      <div className={`p-3 rounded-xl ${theme.iconBg} ${theme.text}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 leading-none mt-1">{count}</p>
      </div>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  const cfg: any = {
    PENDING: "bg-red-50 text-red-600 border-red-200",
    APPROVED: "bg-yellow-50 text-yellow-600 border-yellow-200",
    COMPLETED: "bg-green-50 text-green-600 border-green-200",
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${cfg[status] || cfg.PENDING}`}>{status}</span>;
}