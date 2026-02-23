"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileText, Edit, Calendar, ChevronDown, Search, AlignJustify } from 'lucide-react';
import FormPermohonanModal from './form_pds/page';

export default function PermohonanPDS() {
  // State untuk pop-up form
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Table (Dibuat kosong sesuai permintaan)
  const [tableData, setTableData] = useState<any[]>([]);

  // State untuk filter custom (Dropdown + Search + Checkbox)
  const [isLokasiOpen, setIsLokasiOpen] = useState(false);
  const [lokasiSearch, setLokasiSearch] = useState('');
  
  const [isKeperluanOpen, setIsKeperluanOpen] = useState(false);
  const [keperluanSearch, setKeperluanSearch] = useState('');

  // data opsi untuk checkbox filter
  const opsiLokasi = ['LAUT JAWA', 'LAUT BANDA', 'SELAT SUNDA', 'JAKARTA PORT', 'SURABAYA PORT'];
  const opsiKeperluan = ['TRAINING LEAD', 'INSPECTION', 'SURVEY KAPAL', 'AUDIT TAHUNAN'];

  // Fungsi untuk menutup dropdown custom saat klik di luar (Opsional tapi best practice)
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
  // Menghitung jumlah masing-masing status dari isi tableData
  const summaryData = {
    totalPermohonan: tableData.length,
    menungguPersetujuan: tableData.filter((item) => item.status === 'Proses').length,
    uploadBukti: tableData.filter((item) => item.status === 'Upload Bukti').length,
    selesai: tableData.filter((item) => item.status === 'Selesai').length,
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-8 min-h-screen font-sans">
      
      {/* Title */}
      <h1 className="text-4xl font-bold text-[#1F2937] mb-6">Permohonan PDS</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-pink-50 p-4 rounded-xl flex items-center gap-4 border border-pink-100">
          <div className="p-3 bg-pink-200 rounded-full text-pink-600">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Total Permohonan</p>
            {/* Angka dinamis dari summaryData */}
            <p className="text-xl font-bold text-gray-900">{summaryData.totalPermohonan}</p>
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl flex items-center gap-4 border border-orange-100">
          <div className="p-3 bg-orange-200 rounded-full text-orange-600">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Menunggu Persetujuan</p>
            {/* Angka dinamis dari summaryData */}
            <p className="text-xl font-bold text-gray-900">{summaryData.menungguPersetujuan}</p>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl flex items-center gap-4 border border-purple-100">
          <div className="p-3 bg-purple-200 rounded-full text-purple-600">
            <Edit size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Upload Bukti</p>
            {/* Angka dinamis dari summaryData */}
            <p className="text-xl font-bold text-gray-900">{summaryData.uploadBukti}</p>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
          <div className="p-3 bg-green-200 rounded-full text-green-600">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-semibold">Selesai</p>
            {/* Angka dinamis dari summaryData */}
            <p className="text-xl font-bold text-gray-900">{summaryData.selesai}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-[#0A8E9A] hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium mb-6 transition-colors shadow-sm"
      >
        <Plus size={18} />
        Buat Permohonan
      </button>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200" ref={filterRef}>
        <p className="text-sm font-bold text-gray-700 mb-3">Filter</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Filter Status */}
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-500 cursor-pointer bg-white">
            <option value="">Status</option>
            <option value="Proses">Proses</option>
            <option value="Upload Bukti">Upload Bukti</option>
            <option value="Selesai">Selesai</option>
          </select>

          {/* Filter Lokasi (Search + Checkbox) */}
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
            <option value="">Permohonan</option>
            <option value="PDS">PDS</option>
            <option value="Lembur">Lembur</option>
            <option value="Transportasi">Transportasi</option>
          </select>

          {/* Filter Tanggal */}
          <input 
            type="date" 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-500 cursor-pointer bg-white"
          />

          {/* Filter Keperluan (Search + Checkbox) */}
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

      {/* Table Container - Horizontal Scroll Enabled */}
      <div className="bg-white border-x border-b border-gray-200 overflow-x-auto whitespace-nowrap pb-4">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#B9C6D3] text-gray-800 text-sm">
              <th className="py-3 px-6 font-semibold w-32">Tanggal</th>
              <th className="py-3 px-6 font-semibold w-40">Lokasi</th>
              <th className="py-3 px-6 font-semibold w-32">Permohonan</th>
              <th className="py-3 px-6 font-semibold w-48">Keperluan</th>
              <th className="py-3 px-6 font-semibold text-center w-32">Status</th>
              <th className="py-3 px-6 font-semibold w-32 text-center">Bukti Survey</th>
              <th className="py-3 px-6 font-semibold w-40 text-center">Bukti Transportasi</th>
              <th className="py-3 px-6 font-semibold w-32 text-center">Boarding Pass</th>
              <th className="py-3 px-6 font-semibold w-32 text-center">Bukti Lainnya</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              // Empty State jika tabel kosong
              <tr>
                <td colSpan={9} className="py-12 px-6 text-center text-gray-500 bg-gray-50">
                  <div className="flex flex-col items-center justify-center">
                    <FileText size={40} className="text-gray-300 mb-2" />
                    <p className="font-medium">Belum ada data permohonan PDS.</p>
                    <p className="text-xs mt-1">Silakan klik "Buat Permohonan" untuk menambahkan data.</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Looping data jika sudah ada (Nantinya)
              tableData.map((row, index) => (
                <tr key={index}>
                  {/* ... render row data ... */}
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

      {/* Memanggil Komponen Modal Form Permohonan */}
      <FormPermohonanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </div>
  );
}