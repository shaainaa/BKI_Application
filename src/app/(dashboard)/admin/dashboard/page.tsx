"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
	Calendar,
	ClipboardList,
	Clock3,
	Loader2,
	MapPin,
	Plus,
	UserRound,
	Users,
	X,
} from "lucide-react";

type PdsItem = {
	id: number;
	status: "PENDING" | "APPROVED" | "COMPLETED";
	permohonan: string;
	lokasi: string;
	tanggalPengajuan: string;
	tglBerangkat: string;
	tglKembali: string;
	user?: {
		id: number;
		nama?: string;
		email?: string;
	};
};

type AgendaItem = {
	id: number;
	title: string;
	description: string;
	start: string;
	end: string;
	category: "RAPAT" | "DINAS" | "Familiarisasi Dokumen Teknik" | "URGENT" | "EVENT" | "LAINNYA";
	suratFileUrl?: string | null;
	suratNamaFile?: string | null;
	lampiranFiles?: string | Array<{ name: string; url: string }> | null;
	fileUrl?: string | null;
};

type AgendaForm = {
	title: string;
	description: string;
	start: string;
	end: string;
	category: "RAPAT" | "DINAS" | "Familiarisasi Dokumen Teknik" | "URGENT" | "EVENT" | "LAINNYA";
	fileSurat: File | null;
	lampiranFiles: File[];
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

export default function AdminDashboardPage() {
	const [pdsList, setPdsList] = useState<PdsItem[]>([]);
	const [agendaList, setAgendaList] = useState<AgendaItem[]>([]);
	const [loadingData, setLoadingData] = useState(true);
	const [savingAgenda, setSavingAgenda] = useState(false);
	const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);

	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedDay, setSelectedDay] = useState<Date>(new Date());

	const [agendaForm, setAgendaForm] = useState<AgendaForm>({
		title: "",
		description: "",
		start: "",
		end: "",
		category: "RAPAT",
		fileSurat: null,
		lampiranFiles: [],
	});

	const fetchDashboardData = async () => {
		setLoadingData(true);
		try {
			const [pdsRes, agendaRes] = await Promise.all([
				fetch("/api/admin/pds"),
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
			console.error("Gagal memuat data dashboard:", error);
		} finally {
			setLoadingData(false);
		}
	};

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const stats = useMemo(() => {
		const totalPds = pdsList.length;
		const waitingApproval = pdsList.filter((item) => item.status === "PENDING").length;
		const activeSurveyor = new Set(
			pdsList
				.filter((item) => item.status !== "COMPLETED" && item.user?.id)
				.map((item) => item.user!.id)
		).size;

		return {
			totalPds,
			waitingApproval,
			activeSurveyor,
			totalAgenda: agendaList.length,
		};
	}, [agendaList.length, pdsList]);

	const activities = useMemo(() => {
		return [...pdsList]
			.sort((a, b) => {
				const dateA = new Date(a.tanggalPengajuan || a.tglBerangkat).getTime();
				const dateB = new Date(b.tanggalPengajuan || b.tglBerangkat).getTime();
				return dateB - dateA;
			})
			.slice(0, 8);
	}, [pdsList]);

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

	const formatInputDate = (date: Date) => {
		const year = date.getFullYear();
		const month = `${date.getMonth() + 1}`.padStart(2, "0");
		const day = `${date.getDate()}`.padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const formatDateLabel = (dateString?: string) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return date.toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const formatDateFromDate = (date: Date) => {
		return date.toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const toStartOfDay = (value: Date | string) => {
		const date = new Date(value);
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
	};

	const toEndOfDay = (value: Date | string) => {
		const date = new Date(value);
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
	};

	const isSameDay = (a: Date, b: Date) => {
		return (
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate()
		);
	};

	const agendaForSelectedDay = useMemo(() => {
		const selectedStart = toStartOfDay(selectedDay);

		return agendaList.filter((agenda) => {
			const start = toStartOfDay(agenda.start);
			const end = toEndOfDay(agenda.end);

			return selectedStart >= start && selectedStart <= end;
		});
	}, [agendaList, selectedDay]);

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

	const handleMonthChange = (direction: "prev" | "next") => {
		setSelectedDate((prev) => {
			const next = new Date(prev);
			next.setMonth(direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1);
			return next;
		});
	};

	const handleDateSelect = (date: Date) => {
		setSelectedDay(date);
		const pickedDate = formatInputDate(date);

		setAgendaForm((prev) => ({
			...prev,
			start: prev.start || pickedDate,
			end: prev.end || pickedDate,
		}));
	};

	const openAgendaModal = () => {
		const pickedDate = formatInputDate(selectedDay);
		setAgendaForm((prev) => ({
			...prev,
			start: prev.start || pickedDate,
			end: prev.end || pickedDate,
		}));
		setIsAgendaModalOpen(true);
	};

	const handleSubmitAgenda = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!agendaForm.start || !agendaForm.end) {
			alert("Tanggal mulai dan tanggal berakhir harus diisi.");
			return;
		}

		if (new Date(agendaForm.start) > new Date(agendaForm.end)) {
			alert("Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.");
			return;
		}

		if (!agendaForm.fileSurat) {
			alert("File surat wajib diunggah.");
			return;
		}

		setSavingAgenda(true);

		try {
			const user = JSON.parse(localStorage.getItem("user") || "{}");
			const payload = new FormData();

			payload.append("title", agendaForm.title);
			payload.append("description", agendaForm.description);
			payload.append("start", agendaForm.start);
			payload.append("end", agendaForm.end);
			payload.append("category", agendaForm.category);
			payload.append("createdBy", String(user?.id || ""));
			payload.append("fileSurat", agendaForm.fileSurat);

			agendaForm.lampiranFiles.forEach((file) => {
				payload.append("lampiranFiles", file);
			});

			const response = await fetch("/api/admin/agenda", {
				method: "POST",
				body: payload,
			});

			const result = await response.json();

			if (!result.success) {
				alert(result.message || result.error || "Gagal menambah agenda.");
				return;
			}

			alert("Agenda berhasil ditambahkan.");
			setAgendaForm({
				title: "",
				description: "",
				start: "",
				end: "",
				category: "RAPAT",
				fileSurat: null,
				lampiranFiles: [],
			});
			setIsAgendaModalOpen(false);

			await fetchDashboardData();
		} catch (error) {
			console.error("Gagal menambah agenda:", error);
			alert("Terjadi kesalahan saat menambah agenda.");
		} finally {
			setSavingAgenda(false);
		}
	};

	const getStatusLabel = (status: PdsItem["status"]) => {
		if (status === "PENDING") return "Menunggu Approval";
		if (status === "APPROVED") return "Aktif Survey";
		return "Selesai";
	};

	const getStatusClass = (status: PdsItem["status"]) => {
		if (status === "PENDING") return "bg-amber-100 text-amber-800";
		if (status === "APPROVED") return "bg-sky-100 text-sky-800";
		return "bg-emerald-100 text-emerald-800";
	};

	const parseLampiranFiles = (lampiranValue?: AgendaItem["lampiranFiles"]) => {
		if (!lampiranValue) return [] as Array<{ name: string; url: string }>;

		if (Array.isArray(lampiranValue)) return lampiranValue;

		try {
			const parsed = JSON.parse(lampiranValue);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50 to-emerald-50 p-6 md:p-8">
			<div className="mx-auto max-w-7xl space-y-6">
				<h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
					Dashboard Admin PDS
				</h1>

				<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold text-cyan-900">Total PDS Saat Ini</p>
							<ClipboardList className="text-cyan-700" size={20} />
						</div>
						<p className="text-3xl font-black text-cyan-900">{stats.totalPds}</p>
					</article>

					<article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold text-amber-900">Menunggu Approval Admin</p>
							<Clock3 className="text-amber-600" size={20} />
						</div>
						<p className="text-3xl font-black text-amber-900">{stats.waitingApproval}</p>
					</article>

					<article className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold text-sky-900">Surveyor Aktif Survey</p>
							<Users className="text-sky-700" size={20} />
						</div>
						<p className="text-3xl font-black text-sky-900">{stats.activeSurveyor}</p>
					</article>

					<article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold text-emerald-900">Agenda Kalender</p>
							<Calendar className="text-emerald-700" size={20} />
						</div>
						<p className="text-3xl font-black text-emerald-900">{stats.totalAgenda}</p>
					</article>
				</section>

				<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<h2 className="text-xl font-black text-slate-900">Kalender Agenda</h2>
							<div className="flex flex-wrap items-center gap-2">
								<button
									type="button"
									onClick={openAgendaModal}
									className="rounded-lg bg-cyan-700 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-cyan-800"
								>
									+ Tambah Agenda
								</button>
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
									return (
										<div key={`empty-${index}`} className={`min-h-24 bg-slate-50 ${cellBorderClass}`} />
									);
								}

								const dateKey = formatInputDate(date);
								const hasAgenda = agendaDayMap.has(dateKey);
								const active = isSameDay(date, selectedDay);

								return (
									<button
										key={dateKey}
										type="button"
										onClick={() => handleDateSelect(date)}
										className={`relative min-h-24 p-2 text-left transition ${cellBorderClass} ${
											active
												? "bg-cyan-100"
												: "bg-white hover:bg-sky-50"
										}`}
									>
										<p className="text-sm font-bold text-slate-800">{date.getDate()}</p>
										{hasAgenda && (
											<span className="absolute bottom-2 left-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
												Agenda
											</span>
										)}
									</button>
								);
							})}
							</div>
						</div>

						<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p className="mb-3 text-sm font-bold text-slate-700">
								Agenda pada {formatDateFromDate(selectedDay)}
							</p>

							{agendaForSelectedDay.length === 0 ? (
								<p className="text-sm text-slate-500">Belum ada agenda di tanggal ini.</p>
							) : (
								<div className="space-y-2">
									{agendaForSelectedDay.map((agenda) => (
										<div
											key={agenda.id}
											className="rounded-xl border border-slate-200 bg-white p-3"
										>
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
											{(agenda.suratFileUrl || agenda.fileUrl) && (
												<a
													href={agenda.suratFileUrl || agenda.fileUrl || "#"}
													target="_blank"
													rel="noopener noreferrer"
													className="mt-2 inline-flex text-xs font-semibold text-cyan-700 hover:underline"
												>
													Lihat File Surat
												</a>
											)}
											{parseLampiranFiles(agenda.lampiranFiles).length > 0 && (
												<div className="mt-2 space-y-1">
													<p className="text-xs font-semibold text-slate-600">Lampiran:</p>
													<div className="flex flex-wrap gap-2">
														{parseLampiranFiles(agenda.lampiranFiles).map((lampiran, index) => (
															<a
																key={`${agenda.id}-lampiran-${index}`}
																href={lampiran.url}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex text-xs font-semibold text-teal-700 hover:underline"
															>
																{lampiran.name || `Lampiran ${index + 1}`}
															</a>
														))}
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
				</section>

				{isAgendaModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-2xl rounded-3xl border border-cyan-100 bg-white shadow-2xl">
							<div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
								<h2 className="text-lg font-black text-slate-900 md:text-xl">Tambah Agenda Baru</h2>
								<button
									type="button"
									onClick={() => setIsAgendaModalOpen(false)}
									className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
								>
									<X size={18} />
								</button>
							</div>

							<form onSubmit={handleSubmitAgenda} className="space-y-3 p-5 md:p-6">
								<div className="space-y-1">
									<label className="text-xs font-bold uppercase text-slate-600">Judul</label>
									<input
										type="text"
										value={agendaForm.title}
										onChange={(e) => setAgendaForm((prev) => ({ ...prev, title: e.target.value }))}
										className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
										required
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-bold uppercase text-slate-600">Deskripsi</label>
									<textarea
										value={agendaForm.description}
										onChange={(e) => setAgendaForm((prev) => ({ ...prev, description: e.target.value }))}
										className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
										required
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-bold uppercase text-slate-600">Kategori</label>
									<select
										value={agendaForm.category}
										onChange={(e) =>
											setAgendaForm((prev) => ({
												...prev,
												category: e.target.value as AgendaForm["category"],
											}))
										}
										className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
									>
										<option value="RAPAT">Rapat</option>
										<option value="DINAS">Dinas</option>
										<option value="Familiarisasi Dokumen Teknik">Familiarisasi Dokumen Teknik</option>
										<option value="URGENT">Urgent</option>
										<option value="EVENT">Event</option>
										<option value="LAINNYA">Lainnya</option>
									</select>
								</div>

								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<div className="space-y-1">
										<label className="text-xs font-bold uppercase text-slate-600">Tanggal Mulai</label>
										<input
											type="date"
											value={agendaForm.start}
											onChange={(e) => setAgendaForm((prev) => ({ ...prev, start: e.target.value }))}
											className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
											required
										/>
									</div>
									<div className="space-y-1">
										<label className="text-xs font-bold uppercase text-slate-600">Tanggal Selesai</label>
										<input
											type="date"
											value={agendaForm.end}
											onChange={(e) => setAgendaForm((prev) => ({ ...prev, end: e.target.value }))}
											className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
											required
										/>
									</div>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-bold uppercase text-slate-600">File Surat (Wajib)</label>
									<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-cyan-300 bg-cyan-50 px-3 py-2 text-sm text-cyan-900 hover:bg-cyan-100">
										<Plus size={14} />
										<span>{agendaForm.fileSurat?.name || "Upload File Surat"}</span>
										<input
											type="file"
											onChange={(e) =>
												setAgendaForm((prev) => ({
													...prev,
													fileSurat: e.target.files && e.target.files[0] ? e.target.files[0] : null,
												}))
											}
											className="hidden"
										/>
									</label>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-bold uppercase text-slate-600">File Lampiran (Opsional, Bisa Lebih dari 2)</label>
									<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-100">
										<Plus size={14} />
										<span>
											{agendaForm.lampiranFiles.length > 0
												? `${agendaForm.lampiranFiles.length} file dipilih`
												: "Upload Lampiran (boleh lebih dari 2 file)"}
										</span>
										<input
											type="file"
											multiple
											onChange={(e) =>
												setAgendaForm((prev) => ({
													...prev,
													lampiranFiles: e.target.files ? Array.from(e.target.files) : [],
												}))
											}
											className="hidden"
										/>
									</label>
									{agendaForm.lampiranFiles.length > 0 && (
										<div className="space-y-1">
											{agendaForm.lampiranFiles.map((file, index) => (
												<p key={`${file.name}-${index}`} className="text-xs text-slate-600">
													{index + 1}. {file.name}
												</p>
											))}
										</div>
									)}
								</div>

								<div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-end">
									<button
										type="button"
										onClick={() => setIsAgendaModalOpen(false)}
										className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
									>
										Batal
									</button>
									<button
										type="submit"
										disabled={savingAgenda}
										className="flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{savingAgenda ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
										{savingAgenda ? "Menyimpan..." : "Simpan Agenda"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
					<h2 className="mb-4 text-xl font-black text-slate-900">Recent Activity Surveyor</h2>

					{loadingData ? (
						<div className="flex items-center gap-2 text-sm text-slate-600">
							<Loader2 size={16} className="animate-spin" />
							Memuat aktivitas terbaru...
						</div>
					) : activities.length === 0 ? (
						<p className="text-sm text-slate-500">Belum ada aktivitas surveyor.</p>
					) : (
						<div className="space-y-3">
							{activities.map((item) => (
								<div
									key={item.id}
									className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2 text-sm text-slate-800">
											<UserRound size={14} className="text-slate-500" />
											<p className="font-bold">{item.user?.nama || "Surveyor"}</p>
										</div>
										<p className="text-sm text-slate-700">
											Mengajukan {item.permohonan} untuk {item.lokasi}
										</p>
										<div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
											<span className="inline-flex items-center gap-1">
												<Calendar size={12} />
												Pengajuan: {formatDateLabel(item.tanggalPengajuan)}
											</span>
											<span className="inline-flex items-center gap-1">
												<MapPin size={12} />
												{item.lokasi}
											</span>
										</div>
									</div>
									<span
										className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
											item.status
										)}`}
									>
										{getStatusLabel(item.status)}
									</span>
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
