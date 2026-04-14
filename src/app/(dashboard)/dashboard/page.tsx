"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CircleAlert,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Upload,
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
  bukti?: Array<{
    id: number;
    kategori?: string;
    updatedAt?: string;
  }>;
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

type DepartureItem = {
  id: number;
  lokasi: string;
  tanggal: string;
  status: "PENDING" | "APPROVED" | "COMPLETED";
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
const AGENDA_PER_PAGE = 5;

export default function DashboardSurveyorPage() {
  const [namaUser, setNamaUser] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [pdsList, setPdsList] = useState<PdsItem[]>([]);
  const [agendaList, setAgendaList] = useState<AgendaItem[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [agendaPage, setAgendaPage] = useState(1);

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

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toStartOfDay = (value: Date | string) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  };

  const isDateInRange = (target: Date, startValue?: string, endValue?: string) => {
    if (!startValue || !endValue) return false;
    const start = toStartOfDay(startValue);
    const end = toStartOfDay(endValue);
    return target >= start && target <= end;
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
    const today = toStartOfDay(new Date());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

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

    const agendaHariIni = agendaList.filter((agenda) =>
      isDateInRange(today, agenda.start, agenda.end)
    ).length;

    const jadwalVisit7Hari = pdsList.filter((item) => {
      if (!item.tglBerangkat) return false;
      const berangkat = toStartOfDay(item.tglBerangkat);
      return berangkat >= today && berangkat <= nextWeek;
    }).length;

    const uploadPending = pdsList.filter((item) => {
      if (item.status !== "APPROVED") return false;
      const buktiCount = item.bukti?.length || 0;
      return buktiCount < 4;
    }).length;

    return {
      total,
      pending,
      approved,
      completed,
      agendaBulanIni,
      agendaHariIni,
      jadwalVisit7Hari,
      uploadPending,
    };
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

  const totalAgendaPages = Math.max(1, Math.ceil(agendaBulanTerpilih.length / AGENDA_PER_PAGE));

  const pagedAgendaBulanTerpilih = useMemo(() => {
    const startIndex = (agendaPage - 1) * AGENDA_PER_PAGE;
    return agendaBulanTerpilih.slice(startIndex, startIndex + AGENDA_PER_PAGE);
  }, [agendaBulanTerpilih, agendaPage]);

  const aktivitasUpdate = useMemo(() => {
    const pdsActivities: ActivityItem[] = pdsList.map((item) => {
      const statusLabel =
        item.status === "PENDING"
          ? "Menunggu persetujuan admin"
          : item.status === "APPROVED"
          ? `Disetujui, bukti: ${item.bukti?.length || 0}/4`
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

  const keberangkatanMendatang = useMemo<DepartureItem[]>(() => {
    const today = toStartOfDay(new Date());

    return pdsList
      .filter((item) => item.tglBerangkat)
      .map((item) => ({
        id: item.id,
        lokasi: item.lokasi || "Lokasi belum diisi",
        tanggal: item.tglBerangkat as string,
        status: item.status,
      }))
      .filter((item) => toStartOfDay(item.tanggal) >= today)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
      .slice(0, 5);
  }, [pdsList]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1);
      return next;
    });
  };

  useEffect(() => {
    setAgendaPage(1);
  }, [selectedDate]);

  useEffect(() => {
    if (agendaPage > totalAgendaPages) {
      setAgendaPage(totalAgendaPages);
    }
  }, [agendaPage, totalAgendaPages]);

  return (
    <div className="flex-1 bg-gray-50/50 p-6 min-h-screen font-sans text-[#1F2937] md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Dashboard Surveyor</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Selamat datang, <span className="font-bold text-slate-800">{namaUser || "Surveyor"}</span>. Pantau agenda,
            jadwal visit, dan progres upload bukti dari satu tempat.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 md:text-sm">
          <CalendarDays size={16} />
          Kalender agenda aktif sebagai fitur utama
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-rose-800">Bukti Belum Lengkap</p>
          <p className="mt-2 text-3xl font-black text-rose-900">{kpi.uploadPending}</p>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">Agenda Hari Ini</p>
              <p className="mt-1 text-2xl font-black text-cyan-900">{kpi.agendaHariIni}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Visit 7 Hari Kedepan</p>
              <p className="mt-1 text-2xl font-black text-emerald-900">{kpi.jadwalVisit7Hari}</p>
            </div>
          </div>

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
                  <div key={dateKey} className={`relative min-h-24 bg-white p-2 text-left ${cellBorderClass}`}>
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
                {pagedAgendaBulanTerpilih.map((agenda) => (
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

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-100 p-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Halaman {agendaPage} dari {totalAgendaPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAgendaPage((prev) => Math.max(1, prev - 1))}
                      disabled={agendaPage === 1}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgendaPage((prev) => Math.min(totalAgendaPages, prev + 1))}
                      disabled={agendaPage === totalAgendaPages}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Quick Action Surveyor</h2>
            <div className="space-y-2">
              <Link
                href="/pds/permohonan"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
              >
                <span className="inline-flex items-center gap-2"><FileText size={16} /> Buat Permohonan</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/pds/permohonan"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <span className="inline-flex items-center gap-2"><Upload size={16} /> Upload Bukti</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/pds/riwayat"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span className="inline-flex items-center gap-2"><ClipboardCheck size={16} /> Cek Riwayat</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Jadwal Keberangkatan Terdekat</h2>
            {keberangkatanMendatang.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada jadwal keberangkatan terdekat.</p>
            ) : (
              <div className="space-y-3">
                {keberangkatanMendatang.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-800">{item.lokasi}</p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                      <span>{formatShortDate(item.tanggal)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          item.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : item.status === "APPROVED"
                            ? "bg-cyan-100 text-cyan-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Checklist Harian</h2>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <CircleAlert size={16} className="mt-0.5 text-amber-500" />
                <p>Periksa agenda hari ini sebelum berangkat.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />
                <p>Pastikan bukti survey dan transportasi sudah terunggah.</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-cyan-600" />
                <p>Validasi lokasi visit dengan agenda agar tidak bentrok jadwal.</p>
              </div>
            </div>
          </article>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tren Pengajuan PDS ({selectedDate.getFullYear()})</h2>
              <span className="text-xs font-semibold text-slate-500">Update berdasarkan tanggal pengajuan</span>
            </div>

            <div className="h-[300px] w-full">
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
                    formatter={(value) => `${Number(value ?? 0)} pengajuan`}
                    labelStyle={{ color: "#374151", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorTotalPds)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-bold">Aktivitas Update</h2>

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
                    className={`flex items-center justify-center rounded-xl p-2.5 ${
                      item.kind === "pds" ? "bg-cyan-100 text-cyan-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.kind === "pds" ? <FileText size={18} /> : <CalendarDays size={18} />}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.subtitle}</p>
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
