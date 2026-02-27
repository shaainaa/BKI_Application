"use client";

import React, { useEffect, useState } from 'react';
import { Edit, FileText, X, Search, Calendar, XCircle, Check } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';

export default function AdminPersetujuanPDS() {
  const [listPds, setListPds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPds, setSelectedPds] = useState<any>(null);

  // State untuk input khusus Admin
  const [adminInput, setAdminInput] = useState({
    nomorPdsTrans: '',
    nominal: '',
    sps: '',
    so: ''
  });

  const [previewData, setPreviewData] = useState<any>(null); 

  const fetchAllPds = async () => {
    setLoading(true);
    try {
      // Pastikan API ini mengambil data PDS beserta relasi User (include: { user: true })
      const res = await fetch('/api/admin/pds');
      const result = await res.json();
      if (result.success) setListPds(result.data);
    } catch (err) {
      console.error("Gagal mengambil data admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllPds(); }, []);

  // Buka Modal form untuk mengisi data akhir (SPS, Nominal, SO)
  const handleOpenModal = (pds: any) => {
    setSelectedPds(pds);
    setAdminInput({
      nomorPdsTrans: pds.nomorPdsTrans || '',
      nominal: pds.nominal || '',
      sps: pds.sps || '',
      so: pds.so || ''
    });
    setIsModalOpen(true);
  };

  // Fungsi untuk Approve tahap awal (PENDING -> APPROVED)
  const handleApproveAwal = async (id: number) => {
    if (!confirm(`Setujui permohonan ini? Surveyor akan mendapat notifikasi untuk memulai survey.`)) return;

    try {
      const res = await fetch('/api/admin/pds', {
        method: 'PATCH',
        body: JSON.stringify({ id, status: 'APPROVED' }),
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        alert("Permohonan disetujui!");
        fetchAllPds(); // Refresh tabel
      } else {
        alert("Gagal menyetujui: " + result.message);
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan");
    }
  };

  // Fungsi Submit (Kirim) oleh Admin tahap akhir (APPROVED -> COMPLETED)
  const handleKirimFormAkhir = async () => {
    if (!confirm(`Selesaikan permohonan ini? Data nominal dan SO akan disimpan.`)) return;

    try {
      const payload = {
        id: selectedPds.id,
        status: 'COMPLETED', // Status akhir
        ...adminInput // Kirim juga 4 data baru yang diisi admin
      };

      const res = await fetch('/api/admin/pds', { 
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await res.json();
      if (result.success) {
        alert("Permohonan berhasil diselesaikan!");
        setIsModalOpen(false);
        fetchAllPds(); // Refresh tabel
      } else {
        alert("Gagal memproses: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    }
  };

  // Helper untuk format tanggal
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-8 bg-[#f8f9fa] min-h-screen">
      <h1 className="text-[40px] font-bold text-[#202c45] mb-8">Permohonan PDS</h1>

      {/* Box Utama */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        
        {/* Filter Bar */}
        <div className="mb-6">
          <p className="font-semibold text-gray-700 mb-3">Filter</p>
          <div className="flex gap-4 flex-wrap">
            <select className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] text-gray-600 outline-none focus:border-teal-500 appearance-none bg-white">
              <option>Nama</option>
            </select>
            <select className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] text-gray-600 outline-none focus:border-teal-500 appearance-none bg-white">
              <option>Lokasi</option>
            </select>
            <select className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] text-gray-600 outline-none focus:border-teal-500 appearance-none bg-white">
              <option>Jenis</option>
            </select>
            <div className="relative flex-1 min-w-[150px]">
              <input type="text" placeholder="Tanggal" className="w-full border border-gray-300 rounded-full px-5 py-2.5 text-gray-600 outline-none focus:border-teal-500" />
              <Calendar className="absolute right-4 top-2.5 text-gray-400" size={18} />
            </div>
            <select className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] text-gray-600 outline-none focus:border-teal-500 appearance-none bg-white">
              <option>Keperluan</option>
            </select>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-sm text-gray-800">
            <thead className="bg-[#b3c1d1] text-[#202c45] text-base font-semibold">
              <tr>
                <th className="py-4 px-6 rounded-tl-2xl">Nama</th>
                <th className="py-4 px-6">Lokasi</th>
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Jenis</th>
                <th className="py-4 px-6">Keperluan</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 rounded-tr-2xl text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Memuat data...</td></tr>
              ) : listPds.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">Belum ada data permohonan.</td></tr>
              ) : (
                listPds.map((data: any) => (
                  <tr key={data.id} className="hover:bg-gray-50 transition-colors">
                    {/* Menggunakan data.user.name atau data.user.nama */}
                    <td className="py-4 px-6 font-medium">{data.user?.nama || data.user?.name || `User #${data.userId}`}</td>
                    <td className="py-4 px-6 uppercase">{data.lokasi}</td>
                    <td className="py-4 px-6">{formatDate(data.tanggalPengajuan)}</td>
                    <td className="py-4 px-6 uppercase">{data.jenis || 'TRANSPORT'}</td>
                    <td className="py-4 px-6 uppercase truncate max-w-[150px]">{data.keperluan}</td>
                    <td className="py-4 px-6 font-semibold">
                      {data.status === 'PENDING' && <span className="text-red-500">Pending</span>}
                      {data.status === 'APPROVED' && <span className="text-gray-800">Progress</span>}
                      {data.status === 'COMPLETED' && <span className="text-teal-600">Selesai</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        {/* Preview PDF */}
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
                        <button 
                          onClick={() => setPreviewData(data)}
                          className="p-1.5 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                          title="Lihat Surat"
                        >
                          <FileText size={18} />
                        </button>

                        {/* TAMPILKAN CHECKLIST JIKA STATUS PENDING */}
                        {data.status === 'PENDING' && (
                          <button 
                            onClick={() => handleApproveAwal(data.id)}
                            className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600"
                            title="Setujui Permohonan (Progress)"
                          >
                            <Check size={18} />
                          </button>
                        )}

                        {/* TAMPILKAN PENSIL FORM JIKA STATUS APPROVED */}
                        {data.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleOpenModal(data)}
                            className="p-1.5 bg-[#008cff] text-white rounded-md hover:bg-blue-600"
                            title="Proses Data Akhir"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM PERSETUJUAN PDS (Untuk Tahap Akhir) */}
      {isModalOpen && selectedPds && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X size={28} />
            </button>

            <h2 className="text-2xl font-bold text-[#0A8E9A] mb-8 text-center">
              Form Penyelesaian PDS
            </h2>

            <div className="space-y-4">
              {/* Bagian Read-Only sengaja disingkat agar ringkas, gunakan seperti sebelumnya */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Nama Surveyor</label>
                <input type="text" readOnly value={selectedPds.user?.nama || selectedPds.user?.name || ''} className="w-full bg-[#f1f1f1] border-none rounded-lg px-4 py-3 text-gray-700 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Permohonan</label>
                <input type="text" readOnly value={selectedPds.jenis || ''} className="w-full bg-[#f1f1f1] border-none rounded-lg px-4 py-3 text-gray-700 outline-none" />
              </div>

              {/* === BAGIAN INPUT ADMIN === */}
              <div className="pt-4 mt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4 italic">* Silakan isi data di bawah ini untuk menyelesaikan proses:</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">Nomor PDS/Trans</label>
                    <input 
                      type="text" 
                      value={adminInput.nomorPdsTrans}
                      onChange={(e) => setAdminInput({...adminInput, nomorPdsTrans: e.target.value})}
                      className="w-full bg-[#f1f1f1] focus:bg-white border border-transparent focus:border-teal-500 rounded-lg px-4 py-3 text-gray-900 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">Nominal</label>
                    <input 
                      type="text" 
                      value={adminInput.nominal}
                      onChange={(e) => setAdminInput({...adminInput, nominal: e.target.value})}
                      className="w-full bg-[#f1f1f1] focus:bg-white border border-transparent focus:border-teal-500 rounded-lg px-4 py-3 text-gray-900 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">SPS</label>
                    <input 
                      type="text" 
                      value={adminInput.sps}
                      onChange={(e) => setAdminInput({...adminInput, sps: e.target.value})}
                      className="w-full bg-[#f1f1f1] focus:bg-white border border-transparent focus:border-teal-500 rounded-lg px-4 py-3 text-gray-900 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">SO</label>
                    <input 
                      type="text" 
                      value={adminInput.so}
                      onChange={(e) => setAdminInput({...adminInput, so: e.target.value})}
                      className="w-full bg-[#f1f1f1] focus:bg-white border border-transparent focus:border-teal-500 rounded-lg px-4 py-3 text-gray-900 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Submit */}
              <div className="pt-6">
                <button 
                  onClick={handleKirimFormAkhir}
                  className="bg-[#0A8E9A] text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Selesaikan & Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}