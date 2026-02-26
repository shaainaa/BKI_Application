"use client";

import React, { useEffect, useState } from 'react';
import { Check, XCircle, Eye, Search } from 'lucide-react';

export default function AdminPersetujuanPDS() {
  const [listPds, setListPds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllPds = async () => {
    try {
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

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!confirm(`Yakin ingin mengubah status menjadi ${newStatus}?`)) return;

    try {
      const res = await fetch('/api/admin/pds', {
        method: 'PATCH',
        body: JSON.stringify({ id, status: newStatus }),
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        fetchAllPds(); // Refresh data
      }
    } catch (err) {
      alert("Gagal update status");
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Monitoring PDS</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola dan setujui permohonan dinas surveyor BKI Surabaya</p>
        </div>
        <div className="relative w-64">
          <input type="text" placeholder="Cari No. Agenda..." className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500" />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
            <tr>
              <th className="py-4 px-6">Surveyor ID</th>
              <th className="py-4 px-6">No. Agenda</th>
              <th className="py-4 px-6">Lokasi</th>
              <th className="py-4 px-6">Tgl Berangkat</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {listPds.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-gray-700">User #{row.userId}</td>
                <td className="py-4 px-6 text-gray-600">{row.noAgenda}</td>
                <td className="py-4 px-6 font-bold text-[#0A8E9A]">{row.lokasi}</td>
                <td className="py-4 px-6 text-gray-500">{new Date(row.tglBerangkat).toLocaleDateString()}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    row.status === 'PENDING' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-center gap-2">
                    {row.status === 'PENDING' && (
                      <button 
                        onClick={() => handleUpdateStatus(row.id, 'APPROVED')}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm transition-all"
                        title="Setujui"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Lihat Detail">
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}