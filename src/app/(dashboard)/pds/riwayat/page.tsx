"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Map, 
  Wallet, 
  ChevronDown, 
  Search, 
  FileText, 
  AlignJustify, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';

export default function RiwayatPDS() {
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Filter Dinamis (Sesuai Permohonan PDS)
  const [opsiLokasi, setOpsiLokasi] = useState<string[]>([]);
  const [opsiKeperluan, setOpsiKeperluan] = useState<string[]>([]);
  
  const [isLokasiOpen, setIsLokasiOpen] = useState(false);
  const [isKeperluanOpen, setIsKeperluanOpen] = useState(false);
  const [lokasiSearch, setLokasiSearch] = useState('');
  const [keperluanSearch, setKeperluanSearch] = useState('');

  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [selectedLokasi, setSelectedLokasi] = useState<string[]>([]);
  const [selectedKeperluan, setSelectedKeperluan] = useState<string[]>([]);

  const [previewData, setPreviewData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return;
      const user = JSON.parse(userRaw);

      // 1. Ambil Data (Hanya yang COMPLETED untuk Riwayat)
      const resData = await fetch(`/api/pds/list?userId=${user.id}&status=COMPLETED`);
      const resultData = await resData.json();
      if (resultData.success) setTableData(resultData.data);

      // 2. Ambil Opsi Filter
      const resFilter = await fetch('/api/pds/filters');
      const resultFilter = await resFilter.json();
      if (resultFilter.success) {
        setOpsiLokasi(resultFilter.lokasi);
        setOpsiKeperluan(resultFilter.keperluan);
      }
    } catch (err) {
      console.error("Gagal load riwayat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // --- LOGIKA FILTERING (Status Pembayaran + Lokasi + Keperluan) ---
  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      const matchStatus = item.status === 'COMPLETED'; // Hanya tampilkan yang COMPLETED
      const matchPayment = selectedPaymentStatus === '' || item.statusPembayaran === selectedPaymentStatus;
      const matchLokasi = selectedLokasi.length === 0 || selectedLokasi.includes(item.lokasi);
      const matchKeperluan = selectedKeperluan.length === 0 || selectedKeperluan.includes(item.keperluan);
      return matchStatus && matchPayment && matchLokasi && matchKeperluan;
    });
  }, [tableData, selectedPaymentStatus, selectedLokasi, selectedKeperluan]);

  // Summary Card Data (Sesuai kebutuhan Finansial)
  const summary = {
    sudahBayar: tableData.filter(i => i.statusPembayaran === 'Sudah').length,
    totalVisit: tableData.length,
    totalNominal: tableData.reduce((total, item) => total + (Number(item.nominalPDS) || 0), 0)
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
    }).format(angka);
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
      <h1 className="text-4xl font-bold text-[#1F2937] mb-6 tracking-tight">Riwayat PDS</h1>

      {/* Summary Cards - Konsisten dengan Tema Permohonan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Sudah Dibayar" count={summary.sudahBayar} color="green" icon={<ClipboardList size={20}/>} />
        <StatCard title="Total Visit" count={summary.totalVisit} color="blue" icon={<Map size={20}/>} />
        <StatCard title="Nominal PDS" count={formatRupiah(summary.totalNominal)} color="orange" icon={<Wallet size={20}/>} />
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-t-2xl border border-gray-200" ref={filterRef}>
        <div className="flex items-center gap-2 mb-4 text-[#0A8E9A]">
          <AlignJustify size={18} />
          <p className="text-sm font-bold uppercase tracking-wider">Filter Riwayat</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Status Pembayaran</option>
            <option value="Sudah">Sudah Dibayar</option>
            <option value="Belum">Belum Dibayar</option>
          </select>

          <FilterDropdown 
            label="Lokasi" isOpen={isLokasiOpen} setIsOpen={setIsLokasiOpen} 
            searchValue={lokasiSearch} setSearchValue={setLokasiSearch} 
            options={opsiLokasi} selectedOptions={selectedLokasi} 
            onToggle={(val: string) => toggleFilter(selectedLokasi, setSelectedLokasi, val)}
            otherDropdownClose={() => setIsKeperluanOpen(false)}
          />

          <FilterDropdown 
            label="Keperluan" isOpen={isKeperluanOpen} setIsOpen={setIsKeperluanOpen} 
            searchValue={keperluanSearch} setSearchValue={setKeperluanSearch} 
            options={opsiKeperluan} selectedOptions={selectedKeperluan} 
            onToggle={(val: string) => toggleFilter(selectedKeperluan, setSelectedKeperluan, val)}
            otherDropdownClose={() => setIsLokasiOpen(false)}
          />

          <input type="date" className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer" />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border-x border-b border-gray-200 shadow-sm overflow-x-auto rounded-b-2xl">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-[#B9C6D3] text-gray-800 text-[13px] tracking-widest whitespace-nowrap">
              <th className="py-4 px-6 font-bold text-center">Tanggal</th>
              <th className="py-4 px-6 font-bold text-center">Tujuan</th>
              <th className="py-4 px-6 font-bold text-center">Permohonan</th>
              <th className="py-4 px-6 font-bold text-center">Keperluan</th>
              <th className="py-4 px-6 font-bold text-center">Nominal PDS</th>
              <th className="py-4 px-6 font-bold text-center">SO</th>
              <th className="py-4 px-6 font-bold text-center">SPS</th>
              <th className="py-4 px-6 font-bold text-center">Status Bayar</th>
              <th className="py-4 px-6 font-bold text-center">Tgl Bayar</th>
              <th className="py-4 px-6 font-bold text-center">Surat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={10} className="py-20 text-center text-gray-400">Loading data riwayat...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-20 text-center bg-gray-50">
                  <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-gray-500 italic text-sm">Belum ada riwayat PDS yang selesai.</p>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-600 justify-center">{new Date(row.tanggalPengajuan).toLocaleDateString('id-ID')}</td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-800 justify-center">{row.lokasi}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black italic uppercase">{row.permohonan}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 italic">{row.keperluan}</td>
                  <td className="py-4 px-6 text-sm font-bold text-teal-700">{row.nominalPDS ? formatRupiah(row.nominalPDS) : '-'}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{row.noAgenda}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">-</td> {/* Sesuaikan jika ada kolom SPS di DB */}
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      row.statusPembayaran === 'Sudah' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {row.statusPembayaran || 'BELUM'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 text-center">{row.tanggalPembayaran || '-'}</td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => setPreviewData(row)} className="flex items-center gap-1 text-[#0A8E9A] hover:underline font-bold text-xs mx-auto">
                      <FileText size={14} /> Lihat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Preview (Konsisten) */}
      {previewData && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6'>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className='p-4 border-b flex justify-between items-center bg-gray-50'>
              <div className='gap-2 flex items-center'> 
                <FileText size={20} className='text-[#0A8E9A]' />
                <h3 className="font-bold text-gray-800 italic">Arsip PDS - {previewData?.noAgenda}</h3>
              </div>
              <button onClick={() => setPreviewData(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
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

// Reusable Components (StatCard & FilterDropdown dari Permohonan PDS)
function StatCard({ title, count, color, icon }: any) {
  const themes: any = {
    green: { bg: "bg-green-50", border: "border-green-300", text: "text-green-600", iconBg: "bg-green-200" },
    blue: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-600", iconBg: "bg-blue-200" },
    orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-600", iconBg: "bg-orange-200" },
  };
  const theme = themes[color] || themes.blue;
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
          <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
            {options.filter((o: string) => o.toLowerCase().includes(searchValue.toLowerCase())).map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2 p-2 hover:bg-teal-50 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" className="accent-[#0A8E9A]" 
                  checked={selectedOptions.includes(opt)}
                  onChange={() => onToggle(opt)}
                /> {opt}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}