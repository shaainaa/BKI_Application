"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  ClipboardList, 
  Map, 
  Wallet, 
  ChevronDown, 
  Search, 
  FileText 
} from 'lucide-react';

export default function RiwayatPDS() {
  // State Table (Dibuat kosong untuk sementara, akan diisi dengan data dari database)
  const [tableData, setTableData] = useState<any[]>([]);

  // State untuk mengontrol dropdown filter (dropdown + search + checkbox)
  const [isLokasiOpen, setIsLokasiOpen] = useState(false);
  const [lokasiSearch, setLokasiSearch] = useState('');
  
  const [isKeperluanOpen, setIsKeperluanOpen] = useState(false);
  const [keperluanSearch, setKeperluanSearch] = useState('');

  // data opsi untuk checkbox filter
  const opsiLokasi = ['LAUT JAWA', 'LAUT BANDA', 'SELAT SUNDA', 'JAKARTA PORT', 'SURABAYA PORT'];
  const opsiKeperluan = ['TRAINING LEAD', 'INSPECTION', 'SURVEY KAPAL', 'AUDIT TAHUNAN'];

  // Fungsi untuk menutup dropdown custom saat klik di luar
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

  // --- LOGIKA PERHITUNGAN SUMMARY CARD ---
  // Dihitung otomatis dari tableData
  const summaryData = {
    // Menghitung berapa banyak yang status pembayarannya "Sudah"
    statusPembayaran: tableData.filter(item => item.statusPembayaran === 'Sudah').length,
    // Total jumlah visit (bisa disesuaikan logikanya nanti, sementara ambil dari jumlah baris/data)
    jumlahVisit: tableData.length,
    // Menjumlahkan total nominal PDS
    nominalPDS: tableData.reduce((total, item) => total + (Number(item.nominalPDS) || 0), 0)
  };

  // Fungsi untuk format Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-8 min-h-screen font-sans">
      
      {/* Title */}
      <h1 className="text-4xl font-bold text-[#1F2937] mb-6">Riwayat PDS</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Card 1: Status Pembayaran */}
        <div className="bg-orange-50 p-4 rounded-xl flex items-center gap-4 border border-orange-100">
          <div className="p-3 bg-orange-200 rounded-full text-orange-600">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Status Pembayaran</p>
            <p className="text-2xl font-bold text-gray-900">{summaryData.statusPembayaran}</p>
          </div>
        </div>

        {/* Card 2: Jumlah Visit */}
        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4 border border-blue-100">
          <div className="p-3 bg-blue-200 rounded-full text-blue-600">
            <Map size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Jumlah Visit</p>
            <p className="text-2xl font-bold text-gray-900">{summaryData.jumlahVisit}</p>
          </div>
        </div>

        {/* Card 3: Nominal PDS */}
        <div className="bg-green-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
          <div className="p-3 bg-green-200 rounded-full text-green-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Nominal PDS</p>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(summaryData.nominalPDS)}</p>
          </div>
        </div>

      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200" ref={filterRef}>
        <p className="text-sm font-bold text-gray-700 mb-3">Filter</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Filter Status (Mungkin untuk Status Pembayaran di halaman ini) */}
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-500 cursor-pointer bg-white">
            <option value="">Status Pembayaran</option>
            <option value="Sudah">Sudah</option>
            <option value="Belum">Belum</option>
          </select>

          {/* Filter Lokasi (Tujuan) */}
          <div className="relative">
            <button 
              onClick={() => { setIsLokasiOpen(!isLokasiOpen); setIsKeperluanOpen(false); }}
              className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white"
            >
              Lokasi <ChevronDown size={16} className="text-gray-400" />
            </button>
            {isLokasiOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-lg rounded-md z-10 p-2">
                <div className="relative mb-2">
                  <input 
                    type="text" placeholder="Cari lokasi..." 
                    value={lokasiSearch} onChange={(e) => setLokasiSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs pl-7 outline-none focus:border-teal-500"
                  />
                  <Search size={12} className="absolute left-2 top-2 text-gray-400" />
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {opsiLokasi.filter(l => l.toLowerCase().includes(lokasiSearch.toLowerCase())).map((lokasi, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input type="checkbox" className="accent-[#0A8E9A]" /> {lokasi}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Permohonan */}
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-500 cursor-pointer bg-white">
            <option value="">Permohonan </option>
            <option value="PDS">PDS</option>
            <option value="Lembur">Lembur</option>
            <option value="Transportasi">Transportasi</option>
          </select>

          {/* Filter Tanggal */}
          <input 
            type="date" 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-500 cursor-pointer bg-white"
          />

          {/* Filter Keperluan */}
          <div className="relative">
            <button 
              onClick={() => { setIsKeperluanOpen(!isKeperluanOpen); setIsLokasiOpen(false); }}
              className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white"
            >
              Keperluan <ChevronDown size={16} className="text-gray-400" />
            </button>
            {isKeperluanOpen && (
              <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 shadow-lg rounded-md z-10 p-2">
                <div className="relative mb-2">
                  <input 
                    type="text" placeholder="Cari keperluan..." 
                    value={keperluanSearch} onChange={(e) => setKeperluanSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs pl-7 outline-none focus:border-teal-500"
                  />
                  <Search size={12} className="absolute left-2 top-2 text-gray-400" />
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {opsiKeperluan.filter(k => k.toLowerCase().includes(keperluanSearch.toLowerCase())).map((keperluan, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input type="checkbox" className="accent-[#0A8E9A]" /> {keperluan}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border-x border-b border-gray-200 overflow-x-auto whitespace-nowrap pb-4">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-[#B9C6D3] text-gray-800 text-sm">
              <th className="py-3 px-6 font-semibold w-32">Tanggal</th>
              <th className="py-3 px-6 font-semibold w-40">Tujuan</th>
              <th className="py-3 px-6 font-semibold w-32">Permohonan</th>
              <th className="py-3 px-6 font-semibold w-48">Keperluan</th>
              <th className="py-3 px-6 font-semibold w-40">Nominal PDS</th>
              <th className="py-3 px-6 font-semibold w-32">SO</th>
              <th className="py-3 px-6 font-semibold w-40">SPS</th>
              <th className="py-3 px-6 font-semibold w-32 text-center">Status Pembayaran</th>
              <th className="py-3 px-6 font-semibold w-40 text-center">Tanggal Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              // Empty State jika tabel kosong
              <tr>
                <td colSpan={9} className="py-12 px-6 text-center text-gray-500 bg-gray-50">
                  <div className="flex flex-col items-center justify-center">
                    <FileText size={40} className="text-gray-300 mb-2" />
                    <p className="font-medium">Belum ada riwayat PDS.</p>
                    <p className="text-xs mt-1">Data akan muncul setelah permohonan PDS berstatus Selesai.</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Looping data jika sudah ada
              tableData.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-sm text-gray-700">{row.tanggal}</td>
                  <td className="py-3 px-6 text-sm text-gray-700">{row.tujuan}</td>
                  <td className="py-3 px-6 text-sm text-gray-700">{row.permohonan}</td>
                  <td className="py-3 px-6 text-sm text-gray-700">{row.keperluan}</td>
                  <td className="py-3 px-6 text-sm text-gray-700">
                    {/* Munculkan nominal jika ada, jika tidak kosongkan */}
                    {row.nominalPDS ? formatRupiah(row.nominalPDS) : '-'}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-700">{row.so || '-'}</td>
                  <td className="py-3 px-6 text-sm text-gray-700">{row.sps || '-'}</td>
                  <td className="py-3 px-6 text-sm text-center">
                    {/* Badge Status Pembayaran (Ijo/Merah) */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      row.statusPembayaran === 'Sudah' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {row.statusPembayaran || 'Belum'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-700 text-center">{row.tanggalPembayaran || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-6 py-4 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Menampilkan {tableData.length === 0 ? 0 : 1} sampai {tableData.length} dari {tableData.length}
        </p>
        <div className="flex items-center gap-2">
          <button 
            disabled={tableData.length === 0}
            className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt; Back
          </button>
          <button className="px-3 py-1 bg-[#0A8E9A] text-white rounded text-sm font-medium">1</button>
          <button 
            disabled={tableData.length === 0}
            className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next &gt;
          </button>
        </div>
      </div>

    </div>
  );
}