"use client";

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FileText, Clock, MapPin, Calendar as CalIcon, Plus, Bell, ChevronRight } from 'lucide-react';

export default function AdminDashboard() {
  const [agendas, setAgendas] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, ongoing: 0, todayEvent: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgenda, setNewAgenda] = useState({ title: '', start: '', end: '', category: 'RAPAT' });

  // Fetch Data
  const fetchData = async () => {
    const res = await fetch('/api/admin/agenda');
    const result = await res.json();
    if (result.success) setAgendas(result.data);
    
    // Fetch stats dari API PDS kamu (asumsi API sudah ada)
    const resPds = await fetch('/api/admin/pds');
    const pdsResult = await resPds.json();
    if (pdsResult.success) {
      const data = pdsResult.data;
      setStats({
        total: data.length,
        pending: data.filter((i: any) => i.status === 'PENDING').length,
        ongoing: data.filter((i: any) => i.status === 'APPROVED').length,
        todayEvent: result.data.length // Simple count for demo
      });
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDateClick = (arg: any) => {
    setNewAgenda({ ...newAgenda, start: arg.dateStr + "T09:00", end: arg.dateStr + "T10:00" });
    setIsModalOpen(true);
  };

  const saveAgenda = async () => {
    const res = await fetch('/api/admin/agenda', {
      method: 'POST',
      body: JSON.stringify(newAgenda),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
    }
  };

  return (
    <div className="p-8 bg-[#F8F9FA] min-h-screen">
      {/* 1. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total PDS" count={stats.total} icon={<FileText />} color="bg-blue-500" />
        <StatCard title="Verifikasi" count={stats.pending} icon={<Clock />} color="bg-yellow-500" />
        <StatCard title="On-Survey" count={stats.ongoing} icon={<MapPin />} color="bg-purple-500" />
        <StatCard title="Agenda Hari Ini" count={stats.todayEvent} icon={<CalIcon />} color="bg-teal-500" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* 2. CALENDAR (Left Side) */}
        <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 italic">Agenda Kegiatan BKI</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#0A8E9A] text-white p-2 rounded-xl hover:scale-105 transition-transform">
              <Plus size={20} />
            </button>
          </div>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={agendas}
            dateClick={handleDateClick}
            eventColor="#0A8E9A"
            height="600px"
          />
        </div>

        {/* 3. SIDEBAR (Right Side) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Bell size={18} className="text-orange-500" /> Aktivitas Terbaru
            </h3>
            <div className="space-y-4">
              <ActivityItem text="Surveyor Jiydan upload bukti PDS #102" time="5 menit yang lalu" />
              <ActivityItem text="PDS #099 disetujui oleh Admin" time="1 jam yang lalu" />
              <ActivityItem text="Rapat Koordinasi Kapal A ditambahkan" time="3 jam yang lalu" />
            </div>
          </div>

          <div className="bg-[#0A8E9A] p-6 rounded-[2rem] text-white shadow-lg">
            <h3 className="font-bold mb-2">Quick Action</h3>
            <p className="text-xs text-teal-100 mb-4">Akses cepat laporan bulanan</p>
            <button className="w-full bg-white/20 hover:bg-white/30 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2">
              Cetak Laporan Bulanan <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH AGENDA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black mb-6 italic text-[#0A8E9A]">Buat Agenda Baru</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Judul Kegiatan" className="w-full border-b-2 p-2 outline-none focus:border-teal-500" onChange={(e)=>setNewAgenda({...newAgenda, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="datetime-local" className="border rounded-xl p-2 text-xs" value={newAgenda.start} onChange={(e)=>setNewAgenda({...newAgenda, start: e.target.value})} />
                <input type="datetime-local" className="border rounded-xl p-2 text-xs" value={newAgenda.end} onChange={(e)=>setNewAgenda({...newAgenda, end: e.target.value})} />
              </div>
              <select className="w-full border rounded-xl p-2" onChange={(e)=>setNewAgenda({...newAgenda, category: e.target.value})}>
                <option value="RAPAT">RAPAT</option>
                <option value="DINAS">DINAS</option>
                <option value="URGENT">URGENT</option>
                <option value="EVENT">EVENT</option>
                <option value="LAINNYA">LAINNYA</option>
              </select>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold">Batal</button>
                <button onClick={saveAgenda} className="flex-1 bg-[#0A8E9A] text-white py-3 rounded-2xl font-bold shadow-lg">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-komponen
function StatCard({ title, count, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`${color} p-3 rounded-2xl text-white shadow-md`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-800">{count}</p>
      </div>
    </div>
  );
}

function ActivityItem({ text, time }: any) {
  return (
    <div className="border-l-2 border-teal-100 pl-4 py-1">
      <p className="text-sm text-gray-700 font-medium">{text}</p>
      <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{time}</p>
    </div>
  );
}