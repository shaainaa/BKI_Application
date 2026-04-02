"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type UserLocal = {
  id?: number;
  nama?: string;
};

type PdsItem = {
  id: number;
  status: "PENDING" | "APPROVED" | "COMPLETED";
  permohonan?: string;
  lokasi?: string;
  tanggalPengajuan?: string;
  tglBerangkat?: string;
  tglKembali?: string;
};

type AgendaItem = {
  id: number;
  title: string;
  description?: string;
  start: string;
  end: string;
  category: string;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  kind: "pds" | "agenda";
  dateValue: number;
};

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function DashboardSurveyorPage() {
  const [namaUser, setNamaUser] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [pdsList, setPdsList] = useState<PdsItem[]>([]);
  const [agendaList, setAgendaList] = useState<AgendaItem[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formatInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (dateString?: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const toStartOfDay = (value: Date | string) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  };

  useEffect(() => {
    const userString = localStorage.getItem("user");

    if (!userString) {
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userString) as UserLocal;
      if (user.nama) setNamaUser(user.nama);
      if (user.id) setUserId(user.id);
    } catch (error) {
      console.error("Gagal membaca data user:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const [pdsRes, agendaRes] = await Promise.all([
          fetch(`/api/pds/list?userId=${userId}`),
          fetch("/api/admin/agenda"),
        ]);

        const [pdsJson, agendaJson] = await Promise.all([pdsRes.json(), agendaRes.json()]);

        if (pdsJson.success) {
          setPdsList(pdsJson.data || []);
        }

        if (agendaJson.success) {
          setAgendaList(agendaJson.data || []);
        }
      } catch (error) {
        console.error("Gagal memuat dashboard surveyor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const kpi = useMemo(() => {
    const total = pdsList.length;
    const pending = pdsList.filter((item) => item.status === "PENDING").length;
    const approved = pdsList.filter((item) => item.status === "APPROVED").length;
    const completed = pdsList.filter((item) => item.status === "COMPLETED").length;

    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const agendaBulanIni = agendaList.filter((agenda) => {
      const start = new Date(agenda.start);
      const end = new Date(agenda.end);
      return end >= monthStart && start <= monthEnd;
    }).length;

    return { total, pending, approved, completed, agendaBulanIni };
  }, [agendaList, pdsList, selectedDate]);

  const chartData = useMemo(() => {
    const year = selectedDate.getFullYear();

    return MONTH_NAMES.map((name, monthIndex) => {
      const total = pdsList.filter((item) => {
        const value = item.tanggalPengajuan || item.tglBerangkat;
        if (!value) return false;
        const d = new Date(value);
        return d.getFullYear() === year && d.getMonth() === monthIndex;
      }).length;

      return {
        name: name.slice(0, 3).toUpperCase(),
        total,
      };
    });
  }, [pdsList, selectedDate]);

  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingEmptyCount = firstDay.getDay();

    const slots: Array<Date | null> = [];

    for (let i = 0; i < leadingEmptyCount; i += 1) {
      slots.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      slots.push(new Date(year, month, day));
    }

    while (slots.length % 7 !== 0) {
      slots.push(null);
    }

    return slots;
  }, [selectedDate]);

  const agendaDayMap = useMemo(() => {
    const map = new Set<string>();

    agendaList.forEach((agenda) => {
      const start = toStartOfDay(agenda.start);
      const end = toStartOfDay(agenda.end);
      const cursor = new Date(start);

      while (cursor <= end) {
        map.add(formatInputDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return map;
  }, [agendaList]);

  const agendaBulanTerpilih = useMemo(() => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

    return agendaList
      .filter((agenda) => {
        const start = new Date(agenda.start);
        const end = new Date(agenda.end);
        return end >= monthStart && start <= monthEnd;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [agendaList, selectedDate]);

  const aktivitasUpdate = useMemo(() => {
    const pdsActivities: ActivityItem[] = pdsList.map((item) => {
      const statusLabel =
        item.status === "PENDING"
          ? "Menunggu persetujuan admin"
          : item.status === "APPROVED"
          ? "Disetujui, lanjut upload bukti"
          : "PDS selesai";

      const dateSource = item.tanggalPengajuan || item.tglBerangkat || new Date().toISOString();

      return {
        id: `pds-${item.id}`,
        title: `${item.permohonan || "PDS"} - ${item.lokasi || "Lokasi"}`,
        subtitle: statusLabel,
        kind: "pds",
        dateValue: new Date(dateSource).getTime(),
      };
    });

    const agendaActivities: ActivityItem[] = agendaList.map((agenda) => ({
      id: `agenda-${agenda.id}`,
      title: `Agenda: ${agenda.title}`,
      subtitle: `${formatDateLabel(agenda.start)} - ${formatDateLabel(agenda.end)}`,
      kind: "agenda",
      dateValue: new Date(agenda.start).getTime(),
    }));

    return [...pdsActivities, ...agendaActivities]
      .sort((a, b) => b.dateValue - a.dateValue)
      .slice(0, 8);
  }, [agendaList, pdsList]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1);
      return next;
    });
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-6 min-h-screen font-sans text-[#1F2937] md:p-8">
      <h1 className="text-3xl font-bold mb-6 md:text-4xl">Selamat datang, {namaUser || "Surveyor"}!</h1>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-6">
        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-sky-800">Total Pengajuan PDS</p>
          <p className="mt-2 text-3xl font-black text-sky-900">{kpi.total}</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-800">Menunggu Approval</p>
          <p className="mt-2 text-3xl font-black text-amber-900">{kpi.pending}</p>
        </article>
        <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-cyan-800">Siap Upload Bukti</p>
          <p className="mt-2 text-3xl font-black text-cyan-900">{kpi.approved}</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800">PDS Selesai</p>
          <p className="mt-2 text-3xl font-black text-emerald-900">{kpi.completed}</p>
        </article>
        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-violet-800">Agenda Bulan Ini</p>
          <p className="mt-2 text-3xl font-black text-violet-900">{kpi.agendaBulanIni}</p>
        </article>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Tren Pengajuan PDS ({selectedDate.getFullYear()})</h2>
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700" type="button">
                Tahun <ChevronDown size={16} />
              </button>
            </div>

            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotalPds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <Tooltip
                    formatter={(value: number) => `${value} pengajuan`}
                    labelStyle={{ color: "#374151", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorTotalPds)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900">Kalender Agenda</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMonthChange("prev")}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Sebelumnya
                </button>
                <p className="min-w-48 text-center text-sm font-bold text-slate-700">
                  {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </p>
                <button
                  type="button"
                  onClick={() => handleMonthChange("next")}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Berikutnya
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-7 bg-slate-100">
                {DAY_NAMES.map((dayName) => (
                  <div
                    key={dayName}
                    className="border-b border-r border-slate-200 py-3 text-center text-xs font-black uppercase text-slate-600 last:border-r-0"
                  >
                    {dayName}
                  </div>
                ))}

                {monthDays.map((date, index) => {
                  const isLastColumn = index % 7 === 6;
                  const cellBorderClass = isLastColumn
                    ? "border-b border-slate-200"
                    : "border-b border-r border-slate-200";

                  if (!date) {
                    return <div key={`empty-${index}`} className={`min-h-24 bg-slate-50 ${cellBorderClass}`} />;
                  }

                  const dateKey = formatInputDate(date);
                  const hasAgenda = agendaDayMap.has(dateKey);

                  return (
                    <div key={dateKey} className={`relative min-h-24 p-2 text-left ${cellBorderClass} bg-white`}>
                      <p className="text-sm font-bold text-slate-800">{date.getDate()}</p>
                      {hasAgenda && (
                        <span className="absolute bottom-2 left-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Agenda
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-bold text-slate-700">
                Jadwal Bulan {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </p>

              {agendaBulanTerpilih.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada agenda pada bulan ini.</p>
              ) : (
                <div className="space-y-2">
                  {agendaBulanTerpilih.map((agenda) => (
                    <div key={agenda.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-900">{agenda.title}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {agenda.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{agenda.description || "-"}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDateLabel(agenda.start)} - {formatDateLabel(agenda.end)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Aktivitas Update</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin" />
              Memuat aktivitas...
            </div>
          ) : aktivitasUpdate.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada update aktivitas.</p>
          ) : (
            <div className="space-y-4">
              {aktivitasUpdate.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl flex items-center justify-center ${
                      item.kind === "pds" ? "bg-cyan-100 text-cyan-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.kind === "pds" ? <FileText size={18} /> : <CalendarDays size={18} />}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock3 size={14} /> Update status real-time dari pengajuan Anda
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 size={14} /> Kalender agenda sama dengan jadwal admin
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={14} /> Pantau rencana kegiatan bulanan dari dashboard
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
