"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Edit, 
  FileText, 
  Calendar, 
  XCircle,
  Check, 
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';

export default function AdminPersetujuanPDS() {
  const [listPds, setListPds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal & Preview
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPds, setSelectedPds] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null); 

  // State Input Admin (Sesuai kolom baru di DB)
  const [adminInput, setAdminInput] = useState({
    nomorPdsTrans: '',
    nominal: '',
    sps: '',
    so: ''
  });

  const [filters, setFilters] = useState({
    nama: '',
    lokasi: '',
    permohonan: '',
    tanggal: '',
    keperluan: '',
    status: '',
  });

  const fetchAllPds = async () => {
    setLoading(true);
    try {
      // Pastikan API Admin me-return data PDS + include User + include BuktiPds
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

  const handleOpenModal = (pds: any) => {
    setSelectedPds(pds);
    // Masukkan data lama jika sudah pernah diisi
    setAdminInput({
      nomorPdsTrans: pds.nomorPdsTrans || '',
      nominal: pds.nominalPDS || '',
      sps: pds.sps || '',
      so: pds.so || ''
    });
    setIsModalOpen(true);
  };

  const handleApproveAwal = async (id: number) => {
    if (!confirm(`Setujui permohonan ini? Surveyor akan mendapat akses untuk upload bukti.`)) return;
    try {
      const res = await fetch('/api/admin/pds', {
        method: 'PATCH',
        body: JSON.stringify({ id, status: 'APPROVED' }),
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        alert("Status diperbarui: APPROVED");
        fetchAllPds();
      }
    } catch (err) { alert("Terjadi kesalahan jaringan"); }
  };

  const handleKirimFormAkhir = async () => {
    if (!confirm(`Simpan data administrasi dan selesaikan PDS ini?`)) return;
    try {
      const payload = { 
        id: selectedPds.id, 
        status: 'COMPLETED', 
        nominal: adminInput.nominal,
        sps: adminInput.sps,
        so: adminInput.so,
        nomorPdsTrans: adminInput.nomorPdsTrans
      };

      const res = await fetch('/api/admin/pds', { 
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await res.json();
      if (result.success) {
        alert("Data Administrasi Berhasil Disimpan!");
        setIsModalOpen(false);
        fetchAllPds();
      }
    } catch (err) { alert("Gagal memproses data"); }
  };

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

  return (
    <div className="p-8 bg-[#f8f9fa] min-h-screen font-sans">
      <h1 className="text-[40px] font-bold text-[#202c45] mb-8 tracking-tight">Persetujuan PDS</h1>

      {/* --- FILTER BAR (TIDAK BERUBAH) --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <p className="font-semibold text-gray-700 mb-3 text-sm">Filter</p>
          <div className="flex gap-4 flex-wrap">
            <select
              value={filters.nama}
              onChange={(e) => setFilters((prev) => ({ ...prev, nama: e.target.value }))}
              className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
            >
              <option value="">Semua Nama</option>
              {filterOptions.nama.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.lokasi}
              onChange={(e) => setFilters((prev) => ({ ...prev, lokasi: e.target.value }))}
              className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
            >
              <option value="">Semua Lokasi</option>
              {filterOptions.lokasi.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.permohonan}
              onChange={(e) => setFilters((prev) => ({ ...prev, permohonan: e.target.value }))}
              className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
            >
              <option value="">Semua Jenis</option>
              {filterOptions.permohonan.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[150px]">
              <input
                type="date"
                value={filters.tanggal}
                onChange={(e) => setFilters((prev) => ({ ...prev, tanggal: e.target.value }))}
                className="w-full border border-gray-300 rounded-full px-5 py-2.5 text-gray-600 outline-none focus:border-teal-500"
              />
            </div>
            <select
              value={filters.keperluan}
              onChange={(e) => setFilters((prev) => ({ ...prev, keperluan: e.target.value }))}
              className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
            >
              <option value="">Semua Keperluan</option>
              {filterOptions.keperluan.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-full px-5 py-2.5 flex-1 min-w-[150px] bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Upload Bukti</option>
              <option value="COMPLETED">Complete</option>
            </select>
          </div>
        </div>

        {/* --- TABEL DATA --- */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-sm text-gray-800 border-collapse">
            <thead className="bg-[#b3c1d1] text-[#202c45] text-base font-semibold">
              <tr className="whitespace-nowrap">
                <th className="py-4 px-6 rounded-tl-2xl">Nama Surveyor</th>
                <th className="py-4 px-6">Lokasi</th>
                <th className="py-4 px-6 text-center">Tanggal</th>
                <th className="py-4 px-6 text-center">Jenis</th>
                <th className="py-4 px-6">Keperluan</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 rounded-tr-2xl text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-20 text-gray-400">Memproses data BKI...</td></tr>
              ) : (
                filteredPds.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-20 text-gray-400">Tidak ada data yang cocok dengan filter.</td></tr>
                ) : (
                filteredPds.map((data: any) => (
                  <tr key={data.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">{data.user?.nama || data.user?.name}</td>
                    <td className="py-4 px-6 uppercase font-medium">{data.lokasi}</td>
                    <td className="py-4 px-6 text-center">{formatDate(data.tanggalPengajuan)}</td>
                    <td className="py-4 px-6 text-center uppercase">{data.permohonan || 'PDS'}</td>
                    <td className="py-4 px-6 max-w-[200px] truncate uppercase italic text-gray-500">{data.keperluan}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-6 py-1 rounded-full text-[10px] font-black tracking-widest ${
                        data.status === 'PENDING' ? 'bg-red-50 text-red-600' : 
                        data.status === 'APPROVED' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-teal-700'
                      }`}>
                        {data.status === 'APPROVED' ? 'UPLOAD BUKTI' : data.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setPreviewData(data)} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all shadow-sm" title="Lihat Surat">
                          <FileText size={18} />
                        </button>
                        {data.status === 'PENDING' && (
                          <button onClick={() => handleApproveAwal(data.id)} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-md">
                            <Check size={18} />
                          </button>
                        )}
                        {(data.status === 'APPROVED' || data.status === 'COMPLETED') && (
                          <button onClick={() => handleOpenModal(data)} className="p-2 bg-[#008cff] text-white rounded-xl hover:bg-blue-600 shadow-md">
                            <Edit size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL SPLIT VIEW (VERIFIKASI + INPUT) --- */}
      {isModalOpen && selectedPds && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-4xl shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
              <XCircle size={32} />
            </button>

            <h2 className="text-3xl font-black text-[#0A8E9A] mb-8 border-b border-gray-100 pb-4 italic">Verifikasi & Penyelesaian</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* SISI KIRI: MENAMPILKAN BUKTI DARI SURVEYOR */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="text-blue-500" size={20} />
                  <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Bukti dari Surveyor</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {['SURVEY', 'TRANSPORTASI', 'PENGINAPAN', 'LAINNYA'].map((kat) => {
                    const existingBukti = selectedPds.bukti?.find((b: any) => b.kategori === kat);
                    return (
                      <div key={kat} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-400 uppercase mb-1">{kat}</span>
                          <span className="text-sm font-bold text-gray-700">{existingBukti ? "File Tersedia" : "Belum Ada"}</span>
                        </div>
                        {existingBukti ? (
                          <a href={existingBukti.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-200 hover:bg-green-100 transition-all text-xs font-bold shadow-sm">
                            <Eye size={14} /> Lihat
                          </a>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 italic"><AlertCircle size={12}/> Menunggu...</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SISI KANAN: FORM INPUT ADMIN (DIISI OLEH ADMIN) */}
              <div className="space-y-5 bg-teal-50/30 p-8 rounded-[2rem] border border-teal-100 shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="text-[#0A8E9A]" size={20} />
                  <h3 className="font-bold text-teal-800 uppercase text-xs tracking-widest">Administrasi BKI</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-teal-600 mb-1 ml-1 uppercase tracking-wider">Nominal PDS (Rp)</label>
                    <input type="number" value={adminInput.nominal} onChange={(e) => setAdminInput({...adminInput, nominal: e.target.value})} className="w-full bg-white border border-teal-200 rounded-2xl px-5 py-4 font-black text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="0" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-teal-600 mb-1 ml-1 uppercase">No. SO</label>
                      <input type="text" value={adminInput.so} onChange={(e) => setAdminInput({...adminInput, so: e.target.value})} className="w-full bg-white border border-teal-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="SO-..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-teal-600 mb-1 ml-1 uppercase">No. SPS</label>
                      <input type="text" value={adminInput.sps} onChange={(e) => setAdminInput({...adminInput, sps: e.target.value})} className="w-full bg-white border border-teal-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="SPS-..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-teal-600 mb-1 ml-1 uppercase">Nomor PDS/Trans</label>
                    <input type="text" value={adminInput.nomorPdsTrans} onChange={(e) => setAdminInput({...adminInput, nomorPdsTrans: e.target.value})} className="w-full bg-white border border-teal-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="PDS/TRANS/..." />
                  </div>
                </div>

                <button onClick={handleKirimFormAkhir} className="w-full bg-[#0A8E9A] text-white font-black py-5 rounded-2xl hover:bg-teal-700 transition-all shadow-xl mt-6 flex items-center justify-center gap-2 tracking-widest">
                  <CheckCircle size={20}/> SELESAIKAN & SIMPAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PREVIEW SURAT PDF --- */}
      {previewData && (
        <div className='fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-6'>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className='p-6 border-b flex justify-between items-center bg-gray-50/50'>
              <div className='gap-3 flex items-center text-[#0A8E9A]'> 
                <FileText size={24} />
                <h3 className="font-bold text-gray-800 italic text-xl tracking-tight uppercase">Arsip Surat Permohonan</h3>
              </div>
              <button onClick={() => setPreviewData(null)}><XCircle size={30} className='text-red-500' /></button>
            </div>
            <div className="flex-1"><PDFViewer width="100%" height="100%" showToolbar={true}><PdsTemplate data={previewData} /></PDFViewer></div>
          </div>
        </div>
      )}
    </div>
  );
}