"use client";

import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';

// Interface untuk Props Modal
interface FormPermohonanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FormPermohonanModal({ isOpen, onClose }: FormPermohonanModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaSurveyor: '',
    email: '',
    permohonan: '',
    tanggalPengajuan: '',
    lokasi: '',
    keperluan: '',
    nomorAgenda: '',
    keberangkatan: '',
    jamBerangkat: '',
    kembali: '',
    jamKembali: '',
    visitKe: '',
    keteranganVisit: '',
    ttdDigital: null as File | null,
  });

  useEffect(() => {
    if (isOpen) {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const User = JSON.parse(userRaw);
        setFormData((prev) => ({
          ...prev,
          namaSurveyor: User.nama || '',
          email: User.email || '',
        }));
      }
    }
  }, [isOpen]);

  // Handler jika modal sedang tertutup
  if (!isOpen) return null;

  // Handler untuk mengubah state text/select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Fitur: Lokasi dan Keperluan otomatis dikonversi ke HURUF KAPITAL (Capslock)
    if (name === 'lokasi' || name === 'keperluan') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handler untuk upload file TTD
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, ttdDigital: e.target.files![0] }));
    }
  };

  // Handler Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const User = JSON.parse(localStorage.getItem('user') || '{}');
      const dataToSubmit = new FormData();

      dataToSubmit.append('userId', User.id);
      dataToSubmit.append('permohonan', formData.permohonan);
      dataToSubmit.append('lokasi', formData.lokasi);
      dataToSubmit.append('keperluan', formData.keperluan);
      dataToSubmit.append('noAgenda', formData.nomorAgenda);
      dataToSubmit.append('tglBerangkat', formData.keberangkatan);
      dataToSubmit.append('jamBerangkat', formData.jamBerangkat);
      dataToSubmit.append('tglKembali', formData.kembali);
      dataToSubmit.append('jamKembali', formData.jamKembali);
      dataToSubmit.append('visitKe', formData.visitKe);
      dataToSubmit.append('keteranganVisit', formData.keteranganVisit);

      if (formData.ttdDigital) {
        dataToSubmit.append('ttdDigitalUrl', formData.ttdDigital);
      }

      const res = await fetch('/api/pds', {
        method: 'POST',
        body: dataToSubmit
      });

      const result = await res.json();

      if (result.success) {
        alert("Permohonan berhasil disimpan!");
        onClose();
        window.location.reload();
      } else {
        alert("Gagal:" + (result.message ||result.error));
      }
    } catch (error) {
      alert("Terjadi Kesalah koneksi database");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop hitam transparan
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Container Modal */}
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative">
        
        {/* Tombol Close (X) di pojok */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Konten Form (Scrollable) */}
        <div className="overflow-y-auto p-6 scrollbar-hide">
          <h2 className="text-xl font-bold text-center text-[#0A8E9A] mb-6">
            Form Permohonan Pembuatan PDS
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nama Surveyor & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-800 uppercase">Surveyor</label>
                <input type="text" value={formData.namaSurveyor} readOnly className="w-full bg-gray-100 rounded-md px-3 py-2 text-xs text-gray-500 outline-none cursor-not-allowed" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-800 uppercase">Email</label>
                <input type="text" value={formData.email} readOnly className="w-full bg-gray-100 rounded-md px-3 py-2 text-xs text-gray-500 outline-none cursor-not-allowed" />
              </div>
            </div>

            {/* Permohonan */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Permohonan</label>
              <select 
                name="permohonan" value={formData.permohonan} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="">Pilih satu</option>
                <option value="PDS">PDS</option>
                <option value="Lembur">LEMBUR</option>
                <option value="Transportasi">TRANSPORTASI</option>
              </select>
            </div>

            {/* Tanggal Pengajuan */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Tanggal Pengajuan</label>
              <input 
                type="date" name="tanggalPengajuan" value={formData.tanggalPengajuan} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Lokasi (Otomatis Capslock) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Lokasi</label>
              <input 
                type="text" name="lokasi" value={formData.lokasi} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500 uppercase"
              />
            </div>

            {/* Keperluan (Otomatis Capslock) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Keperluan</label>
              <input 
                type="text" name="keperluan" value={formData.keperluan} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500 uppercase"
              />
            </div>

            {/* Nomor Agenda */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Nomor Agenda</label>
              <input 
                type="text" name="nomorAgenda" value={formData.nomorAgenda} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Keberangkatan */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Keberangkatan</label>
              <input 
                type="date" name="keberangkatan" value={formData.keberangkatan} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Jam Berangkat (Hanya muncul jika Permohonan == 'Lembur') */}
            {formData.permohonan === 'Lembur' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-gray-800">Jam Berangkat</label>
                <input 
                  type="time" name="jamBerangkat" value={formData.jamBerangkat} onChange={handleChange}
                  className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                />
              </div>
            )}

            {/* Kembali */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Kembali</label>
              <input 
                type="date" name="kembali" value={formData.kembali} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Jam Kembali (Hanya muncul jika Permohonan == 'Lembur') */}
            {formData.permohonan === 'Lembur' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-gray-800">Jam Kembali</label>
                <input 
                  type="time" name="jamKembali" value={formData.jamKembali} onChange={handleChange}
                  className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                />
              </div>
            )}

            {/* Visit Ke */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Visit Ke</label>
              <input 
                type="text" name="visitKe" value={formData.visitKe} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Keterangan Visit */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-800">Keterangan Visit</label>
              <select 
                name="keteranganVisit" value={formData.keteranganVisit} onChange={handleChange}
                className="w-full bg-[#EEEEEE] border-none rounded-md px-3 py-2 text-sm text-gray-500 outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="">Pilih satu</option>
                <option value="Final">Final</option>
                <option value="Progress">Progress</option>
              </select>
            </div>

            {/* TTD Digital */}
            <div className="flex flex-col gap-1 pb-4">
              <label className="text-sm font-bold text-gray-800">TTD Digital</label>
              <label className="flex items-center gap-2 w-full bg-[#EEEEEE] rounded-md px-3 py-2 cursor-pointer border-none hover:bg-gray-200 transition-colors">
                <div className="bg-black text-white p-0.5 rounded-sm">
                  <Plus size={16} />
                </div>
                <span className="text-sm text-gray-500">
                  {formData.ttdDigital ? formData.ttdDigital.name : 'Tambah File'}
                </span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
            </div>

            {/* Tombol Kirim */}
            <button 
              type="submit"
              disabled={loading}
              className={`w-24 bg-[#0A8E9A] text-white font-bold py-2 px-4 rounded-md transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'}`}
            >
              {loading ? '...' : 'Kirim'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}