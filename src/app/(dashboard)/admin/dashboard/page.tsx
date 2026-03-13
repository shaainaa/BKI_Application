"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { createPortal } from 'react-dom';
import { 
  FileText, Clock, MapPin, Calendar as CalIcon, 
  Plus, Bell, ChevronRight, Upload, X 
} from 'lucide-react';

export default function AdminDashboard() {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, ongoing: 0, todayEvent: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState(new Date());

  // State Form
  const [newAgenda, setNewAgenda] = useState({ 
    title: '', description: '', start: '', end: '', category: 'RAPAT', file: null as File | null 
  });

  const fetchData = async () => {
    try {
      const [resA, resP] = await Promise.all([
        fetch('/api/admin/agenda'),
        fetch('/api/admin/pds')
      ]);
      const agendaRes = await resA.json();
      const pdsRes = await resP.json();

      if (agendaRes.success) setAgendas(agendaRes.data);
      if (pdsRes.success) {
        setStats({
          total: pdsRes.data.length,
          pending: pdsRes.data.filter((i: any) => i.status === 'PENDING').length,
          ongoing: pdsRes.data.filter((i: any) => i.status === 'APPROVED').length,
          todayEvent: agendaRes.data.filter((a: any) => 
            new Date(a.start).toDateString() === new Date().toDateString()
          ).length
        });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('title', newAgenda.title);
    formData.append('start', newAgenda.start);
    formData.append('end', newAgenda.end);
    formData.append('category', newAgenda.category);
    if (newAgenda.file) formData.append('file', newAgenda.file);

    const res = await fetch('/api/admin/agenda', { method: 'POST', body: formData });
    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
      setNewAgenda({ title: '',   description: '', start: '', end: '', category: 'RAPAT', file: null });
    }
  };

  const tileContent = ({ date, view }: any) => {
    if (view === 'month') {
      const hasAgenda = agendas.some(a => new Date(a.start).toDateString() === date.toDateString());
      return hasAgenda ? <div className="h-1.5 w-1.5 bg-[#0A8E9A] rounded-full mx-auto mt-1"></div> : null;
    }
  };

  return (
    <div className="p-8 bg-[#F8F9FA] min-h-screen font-sans relative">
      {/* CSS CUSTOM UNTUK KALENDER AGAR TIDAK BENTROK */}
      <style>{`
        .react-calendar { width: 100%; border: none; font-family: inherit; background: transparent; }
        .react-calendar__tile--active { background: #0A8E9A !important; border-radius: 12px; color: white !important; }
        .react-calendar__tile--now { background: #e6f4f5 !important; border-radius: 12px; color: #0A8E9A; font-weight: bold; }
        .react-calendar__navigation button { font-weight: 800; color: #0A8E9A; font-size: 1.2rem; }
        .react-calendar__month-view__weekdays { font-weight: 900; text-transform: uppercase; font-size: 0.7rem; color: #cbd5e1; }
        .react-calendar__tile { padding: 1.5em 0.5em; font-weight: 600; }
      `}</style>

      {/* 1. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total PDS" count={stats.total} icon={<FileText size={22}/>} color="pink" />
        <StatCard title="Menunggu Approval" count={stats.pending} icon={<Clock size={22}/>} color="orange" />
        <StatCard title="Sedang Survey" count={stats.ongoing} icon={<MapPin size={22}/>} color="purple" />
        <StatCard title="Agenda" count={stats.todayEvent} icon={<CalIcon size={22}/>} color="green" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* 2. CALENDAR SECTION */}
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic text-[#202c45]">Agenda BKI Surabaya</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#0A8E9A] text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg hover:bg-teal-700 transition-all active:scale-95"
            >
              <Plus size={18} /> Tambah Agenda
            </button>
          </div>

          <Calendar 
            // Perubahan di sini: Paksa tipe datanya agar sesuai dengan ekspektasi react-calendar
            onChange={(value) => setDate(value as Date)} 
            value={date} 
            tileContent={tileContent}
            onClickDay={(value: Date) => {
            // Memastikan format tanggal lokal untuk input datetime-local (YYYY-MM-DDTHH:mm)
              const tzOffset = value.getTimezoneOffset() * 60000;
              const localISOTime = new Date(value.getTime() - tzOffset).toISOString().slice(0, 16);
    
              setNewAgenda({ ...newAgenda, start: localISOTime });
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* 3. SIDEBAR */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
              <Bell size={16} className="text-orange-500" /> Aktivitas Terbaru
            </h3>
            <div className="space-y-8">
              <ActivityItem text="Surveyor baru saja upload bukti" time="Baru saja" />
              <ActivityItem text="Rapat Bulanan Kapal telah dijadwalkan" time="2 jam yang lalu" />
              <ActivityItem text="PDS Terminal Teluk Lamong disetujui" time="5 jam yang lalu" />
            </div>
          </div>

          <div className="bg-[#0A8E9A] p-8 rounded-[2.5rem] text-white shadow-xl italic relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-2 tracking-tight">Laporan Excel</h3>
              <p className="text-[11px] text-teal-100 mb-6 leading-relaxed font-medium">Rekap otomatis semua data PDS Surveyor.</p>
              <button className="w-full bg-white text-[#0A8E9A] py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
                Download <ChevronRight size={16} />
              </button>
            </div>
            <FileText size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
          </div>
        </div>
      </div>

      {/* --- MODAL FIX MENGGUNAKAN REACT PORTAL --- */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[999999]">
          {/* Gelapkan Background */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Konten Modal */}
          <div className="bg-white p-10 rounded-[3rem] rounded-xl max-w-lg shadow-2xl relative z-[1000000] mx-4 animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-8 right-8 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-all"
            >
              <X size={28} />
            </button>
            
            <h3 className="text-3xl font-black italic text-[#0A8E9A] mb-8 tracking-tighter">Agenda Baru</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Judul Agenda</label>
                <input 
                  type="text" 
                  placeholder="Nama kegiatan..." 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={(e) => setNewAgenda({...newAgenda, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Judul Agenda</label>
                <input 
                  type="text" 
                  placeholder="Deskripsi" 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={(e) => setNewAgenda({...newAgenda, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Mulai</label>
                  <input type="datetime-local" className="bg-gray-50 rounded-2xl p-4 text-xs font-bold outline-none w-full" value={newAgenda.start.slice(0, 16)} onChange={(e) => setNewAgenda({...newAgenda, start: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Selesai</label>
                  <input type="datetime-local" className="bg-gray-50 rounded-2xl p-4 text-xs font-bold outline-none w-full" onChange={(e) => setNewAgenda({...newAgenda, end: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Lampiran</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-[2rem] cursor-pointer hover:bg-gray-50 transition-all">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-[10px] font-bold text-gray-500 px-4 text-center">
                    {newAgenda.file ? newAgenda.file.name : "Klik untuk upload Surat Tugas / Lampiran"}
                  </span>
                  <input type="file" className="hidden" onChange={(e) => setNewAgenda({...newAgenda, file: e.target.files?.[0] || null})} />
                </label>
              </div>

              <button 
                onClick={handleSave} 
                className="w-full bg-[#0A8E9A] text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-teal-700 transition-all active:scale-95"
              >
                Simpan Agenda
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Komponen Helper
function StatCard({ title, count, icon, color }: any) {
  const themes: any = {
    pink: { bg: "bg-pink-50", text: "text-pink-600", icon: "bg-pink-100", border: "border-pink-100" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "bg-orange-100", border: "border-orange-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "bg-purple-100", border: "border-purple-100" },
    green: { bg: "bg-green-50", text: "text-green-600", icon: "bg-green-100", border: "border-green-100" },
  };
  const t = themes[color];
  return (
    <div className={`${t.bg} ${t.border} p-6 rounded-[2.5rem] border flex items-center gap-5 shadow-sm`}>
      <div className={`p-4 rounded-2xl ${t.icon} ${t.text}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{title}</p>
        <p className="text-3xl font-black text-gray-900 leading-none">{count}</p>
      </div>
    </div>
  );
}

function ActivityItem({ text, time }: any) {
  return (
    <div className="relative pl-6 border-l-2 border-teal-100">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-[#0A8E9A]"></div>
      <p className="text-sm font-bold text-gray-800 leading-tight">{text}</p>
      <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-wider">{time}</p>
    </div>
  );
}