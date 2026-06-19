"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Check, FileText, XCircle } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';
import AdminFilterDropdown from '@/components/AdminFilterDropdown';

const DEFAULT_FILTERS = {
	nama: [] as string[],
	lokasi: [] as string[],
	permohonan: [] as string[],
	tahun: [] as string[],
	tanggalMulai: '',
	tanggalAkhir: '',
	keperluan: [] as string[],
	noAgenda: '',
	so: '',
	statusPds: [] as string[],
	statusBukti: [] as string[],
	statusPembayaran: [] as string[],
	tanggalPembayaran: '',
};

type PdsSortItem = {
	id?: number | string | null;
	tglBerangkat?: string | Date | null;
	tanggalPengajuan?: string | Date | null;
};

export default function AdminRiwayatPDSPage() {
	const [listPds, setListPds] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [previewData, setPreviewData] = useState<any>(null);
	const [paymentTarget, setPaymentTarget] = useState<any>(null);
	const [paymentDate, setPaymentDate] = useState('');
	const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

	const fetchRekapPds = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/admin/pds');
			const result = await res.json();

			if (result.success) {
				const withNominal = (result.data || []).filter((item: any) => item.nominalPDS !== null && typeof item.nominalPDS !== 'undefined' && item.nominalPDS !== '');
				setListPds(withNominal);
			}
		} catch (err) {
			console.error('Gagal mengambil rekap PDS:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRekapPds();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [filters]);

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
		const tahun = Array.from(
			new Set(
				listPds
					.map((item: any) => {
						const d = new Date(item.tglBerangkat);
						return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
					})
					.filter((value): value is string => Boolean(value))
			)
		).sort((a, b) => Number(b) - Number(a));

		return { nama, lokasi, permohonan, keperluan, tahun };
	}, [listPds]);

	const filteredPds = useMemo(() => {
		const getDepartureTime = (item: PdsSortItem) => {
			const date = new Date(item.tglBerangkat || '');
			return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
		};

		return listPds.filter((item: any) => {
			const namaUser = item.user?.nama || item.user?.name || '';
			const lokasi = item.lokasi || '';
			const permohonan = item.permohonan || '';
			const keperluan = item.keperluan || '';
			const noAgenda = (item.noAgenda || '').toLowerCase();
			const so = (item.so || '').toLowerCase();
			const itemDate = formatDateInput(item.tglBerangkat || '');
			const itemPaymentDate = formatDateInput(item.tanggalPembayaran);
			const paymentStatus = item.statusPembayaran || 'BELUM_DIBAYAR';
			const statusPds = item.status || '';
			const buktiStatus = getBuktiSummary(item.bukti || []).key;
			const itemYear = itemDate ? itemDate.slice(0, 4) : '';

			const matchNama = filters.nama.length === 0 || filters.nama.includes(namaUser);
			const matchLokasi = filters.lokasi.length === 0 || filters.lokasi.includes(lokasi);
			const matchPermohonan = filters.permohonan.length === 0 || filters.permohonan.includes(permohonan);
			const matchTahun = filters.tahun.length === 0 || filters.tahun.includes(itemYear);
			const matchTanggalMulai = !filters.tanggalMulai || itemDate >= filters.tanggalMulai;
			const matchTanggalAkhir = !filters.tanggalAkhir || itemDate <= filters.tanggalAkhir;
			const matchKeperluan = filters.keperluan.length === 0 || filters.keperluan.includes(keperluan);
			const matchNoAgenda = !filters.noAgenda || noAgenda.includes(filters.noAgenda.toLowerCase());
			const matchSo = !filters.so || so.includes(filters.so.toLowerCase());
			const matchStatusPds = filters.statusPds.length === 0 || filters.statusPds.includes(statusPds);
			const matchStatusBukti = filters.statusBukti.length === 0 || filters.statusBukti.includes(buktiStatus);
			const matchStatusPembayaran = filters.statusPembayaran.length === 0 || filters.statusPembayaran.includes(paymentStatus);
			const matchTanggalPembayaran = !filters.tanggalPembayaran || itemPaymentDate === filters.tanggalPembayaran;

			return (
				matchNama &&
				matchLokasi &&
				matchPermohonan &&
				matchTahun &&
				matchTanggalMulai &&
				matchTanggalAkhir &&
				matchKeperluan &&
				matchNoAgenda &&
				matchSo &&
				matchStatusPds &&
				matchStatusBukti &&
				matchStatusPembayaran &&
				matchTanggalPembayaran
			);
		}).sort((a: PdsSortItem, b: PdsSortItem) => {
			const departureDiff = getDepartureTime(b) - getDepartureTime(a);
			if (departureDiff !== 0) return departureDiff;

			const submittedA = new Date(a.tanggalPengajuan || '').getTime();
			const submittedB = new Date(b.tanggalPengajuan || '').getTime();
			const submittedDiff =
				(Number.isNaN(submittedB) ? 0 : submittedB) -
				(Number.isNaN(submittedA) ? 0 : submittedA);
			if (submittedDiff !== 0) return submittedDiff;

			return Number(b.id || 0) - Number(a.id || 0);
		});
	}, [listPds, filters]);

	const pagedPds = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredPds.slice(start, start + pageSize);
	}, [filteredPds, currentPage, pageSize]);

	const totalPages = Math.max(1, Math.ceil(filteredPds.length / pageSize));

	useEffect(() => {
		setCurrentPage((prev) => Math.min(prev, totalPages));
	}, [totalPages]);

	const summary = useMemo(() => {
		const totalVisit = filteredPds.length;
		const totalNominal = filteredPds.reduce((total, item: any) => total + (Number(item.nominalPDS) || 0), 0);
		const sudahDibayar = filteredPds.filter((item: any) => item.statusPembayaran === 'SUDAH_DIBAYAR').length;
		const belumLengkap = filteredPds.filter((item: any) => item.status !== 'COMPLETED').length;

		return { totalVisit, totalNominal, sudahDibayar, belumLengkap };
	}, [filteredPds]);

	const formatRupiah = (value: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
		}).format(value);
	};

	function getBuktiSummary(bukti: any[] = []) {
		if (!bukti.length) {
			return { key: 'BELUM_UPLOAD', label: 'Bukti Belum Upload', className: 'bg-gray-100 text-gray-600 border-gray-200' };
		}

		const statuses = bukti
			.map((item) => String(item?.verificationStatus || '').toUpperCase().trim())
			.filter(Boolean);

		if (statuses.some((status) => status === 'DIREJECT')) {
			return { key: 'PERLU_REVISI', label: 'Bukti Perlu Revisi', className: 'bg-rose-50 text-rose-700 border-rose-200' };
		}

		const allAccepted = statuses.length > 0 && statuses.every((status) => status === 'DITERIMA');
		if (allAccepted) {
			return { key: 'DITERIMA', label: 'Bukti Diterima', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
		}

		return { key: 'MENUNGGU_VERIFIKASI', label: 'Menunggu Verifikasi', className: 'bg-amber-50 text-amber-700 border-amber-200' };
	}

	function getPdsStatusSummary(status: string) {
		if (status === 'COMPLETED') return { label: 'SELESAI', className: 'bg-green-50 text-teal-700' };
		if (status === 'SUBMITTED') return { label: 'MENUNGGU VERIFIKASI', className: 'bg-blue-50 text-blue-700' };
		if (status === 'APPROVED') return { label: 'DALAM PROSES', className: 'bg-yellow-50 text-yellow-700' };
		if (status === 'WAITING_SECOND_APPROVAL') return { label: 'PENDING 1/2', className: 'bg-amber-50 text-amber-700' };
		return { label: status || '-', className: 'bg-red-50 text-red-600' };
	}

	const openPaymentModal = (item: any) => {
		setPaymentTarget(item);
		setPaymentDate(formatDateInput(item.tanggalPembayaran));
	};

	const closePaymentModal = () => {
		setPaymentTarget(null);
		setPaymentDate('');
	};

	const handleMarkAsPaid = async () => {
		if (!paymentTarget?.id) return;
		if (!paymentDate) {
			alert('Tanggal pembayaran wajib diisi.');
			return;
		}

		setProcessingPaymentId(paymentTarget.id);
		try {
			const paymentIso = new Date(`${paymentDate}T00:00:00`).toISOString();
			const res = await fetch('/api/admin/pds', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: paymentTarget.id,
					statusPembayaran: 'SUDAH_DIBAYAR',
					tanggalPembayaran: paymentIso,
				}),
			});

			const result = await res.json();
			if (!result.success) {
				alert(result.error || 'Gagal memperbarui status pembayaran.');
				return;
			}

			setListPds((prev) =>
				prev.map((item) =>
					item.id === paymentTarget.id
						? { ...item, statusPembayaran: 'SUDAH_DIBAYAR', tanggalPembayaran: paymentIso }
						: item
				)
			);
			closePaymentModal();
			alert('Status pembayaran berhasil diubah menjadi Sudah Dibayar.');
		} catch (err) {
			alert('Terjadi kesalahan jaringan saat update pembayaran.');
		} finally {
			setProcessingPaymentId(null);
		}
	};

	const getMonthAndYear = (dateString: string) => {
		if (!dateString) return { month: '-', year: '-' };
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return { month: '-', year: '-' };

		return {
			month: date.toLocaleDateString('id-ID', { month: 'long' }),
			year: String(date.getFullYear()),
		};
	};

	const handleResetFilters = () => {
		setFilters({ ...DEFAULT_FILTERS });
	};

	return (
		<div className="p-8 bg-[#f8f9fa] min-h-screen font-sans">
			<h1 className="text-[40px] font-bold text-[#202c45] mb-8 tracking-tight">Rekap PDS</h1>

			<div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
						<p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Jumlah Visit</p>
						<p className="mt-1 text-3xl font-black text-blue-900">{summary.totalVisit.toLocaleString('id-ID')}</p>
					</div>
					<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
						<p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Belum Selesai</p>
						<p className="mt-1 text-3xl font-black text-amber-900">{summary.belumLengkap.toLocaleString('id-ID')}</p>
					</div>
					<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
						<p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Status Pembayaran</p>
						<p className="mt-1 text-3xl font-black text-emerald-900">{summary.sudahDibayar.toLocaleString('id-ID')}</p>
					</div>
					<div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
						<p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Nominal PDS</p>
						<p className="mt-1 text-3xl font-black text-orange-900">{formatRupiah(summary.totalNominal)}</p>
					</div>
				</div>

				<div className="mb-6">
					<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
						<p className="font-semibold text-gray-700 text-sm">Filter</p>
						<div className="flex items-center gap-2">
							<button
								onClick={handleResetFilters}
								className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
							>
								Reset
							</button>
						</div>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-inner">
						<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
							<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
								<p className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Data PDS</p>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Nama Surveyor</label>
								<AdminFilterDropdown
									label="Nama Surveyor"
									selectedValues={filters.nama}
									onChange={(value) => setFilters((prev) => ({ ...prev, nama: value }))}
									placeholder="Semua Nama"
									options={filterOptions.nama}
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Lokasi</label>
								<AdminFilterDropdown
									label="Lokasi"
									selectedValues={filters.lokasi}
									onChange={(value) => setFilters((prev) => ({ ...prev, lokasi: value }))}
									placeholder="Semua Lokasi"
									options={filterOptions.lokasi}
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Jenis</label>
								<AdminFilterDropdown
									label="Jenis"
									selectedValues={filters.permohonan}
									onChange={(value) => setFilters((prev) => ({ ...prev, permohonan: value }))}
									placeholder="Semua Jenis"
									options={filterOptions.permohonan}
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Tahun</label>
								<AdminFilterDropdown
									label="Tahun"
									selectedValues={filters.tahun}
									onChange={(value) => setFilters((prev) => ({ ...prev, tahun: value }))}
									placeholder="Semua Tahun"
									options={filterOptions.tahun}
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Keperluan/Objek</label>
								<AdminFilterDropdown
									label="Keperluan / Objek"
									selectedValues={filters.keperluan}
									onChange={(value) => setFilters((prev) => ({ ...prev, keperluan: value }))}
									placeholder="Semua Keperluan/Objek"
									options={filterOptions.keperluan}
								/>
							</div>
								</div>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
								<p className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Administrasi</p>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">No. Agenda</label>
								<input
									type="text"
									value={filters.noAgenda}
									onChange={(e) => setFilters((prev) => ({ ...prev, noAgenda: e.target.value }))}
									placeholder="Cari No. Agenda"
									className="h-10 w-full border border-gray-300 rounded-xl px-3 bg-white text-gray-600 text-sm outline-none focus:border-teal-500"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">No. SO</label>
								<input
									type="text"
									value={filters.so}
									onChange={(e) => setFilters((prev) => ({ ...prev, so: e.target.value }))}
									placeholder="Cari No. SO"
									className="h-10 w-full border border-gray-300 rounded-xl px-3 bg-white text-gray-600 text-sm outline-none focus:border-teal-500"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Status PDS</label>
								<AdminFilterDropdown
									label="Status PDS"
									selectedValues={filters.statusPds}
									onChange={(value) => setFilters((prev) => ({ ...prev, statusPds: value }))}
									placeholder="Semua Status PDS"
									options={['APPROVED', 'SUBMITTED', 'COMPLETED']}
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Status Bukti</label>
								<AdminFilterDropdown
									label="Status Bukti"
									selectedValues={filters.statusBukti}
									onChange={(value) => setFilters((prev) => ({ ...prev, statusBukti: value }))}
									placeholder="Semua Status Bukti"
									options={['BELUM_UPLOAD', 'MENUNGGU_VERIFIKASI', 'PERLU_REVISI', 'DITERIMA']}
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Status Pembayaran</label>
								<AdminFilterDropdown
									label="Status Pembayaran"
									selectedValues={filters.statusPembayaran}
									onChange={(value) => setFilters((prev) => ({ ...prev, statusPembayaran: value }))}
									placeholder="Semua Status Pembayaran"
									options={['BELUM_DIBAYAR', 'SUDAH_DIBAYAR']}
								/>
							</div>
								</div>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
								<p className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Tanggal</p>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Tgl Berangkat Mulai</label>
								<input
									type="date"
									value={filters.tanggalMulai}
									onChange={(e) => setFilters((prev) => ({ ...prev, tanggalMulai: e.target.value }))}
									className="h-10 w-full border border-gray-300 rounded-xl px-3 text-gray-600 text-sm outline-none focus:border-teal-500"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Tgl Berangkat Akhir</label>
								<input
									type="date"
									value={filters.tanggalAkhir}
									onChange={(e) => setFilters((prev) => ({ ...prev, tanggalAkhir: e.target.value }))}
									className="h-10 w-full border border-gray-300 rounded-xl px-3 text-gray-600 text-sm outline-none focus:border-teal-500"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-semibold text-gray-500 mb-1">Tgl Pembayaran</label>
								<input
									type="date"
									value={filters.tanggalPembayaran}
									onChange={(e) => setFilters((prev) => ({ ...prev, tanggalPembayaran: e.target.value }))}
									className="h-10 w-full border border-gray-300 rounded-xl px-3 text-gray-600 text-sm outline-none focus:border-teal-500"
								/>
							</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="overflow-x-auto mt-6">
					<table className="w-full text-left text-sm text-gray-800 border-collapse">
						<thead className="bg-[#b3c1d1] text-[#202c45] text-base font-semibold">
							<tr className="whitespace-nowrap">
								<th className="py-4 px-6 rounded-tl-2xl">Nama Surveyor</th>
								<th className="py-4 px-6">Lokasi</th>
								<th className="py-4 px-6 text-center">Tanggal</th>
								<th className="py-4 px-6 text-center">Jenis</th>
								<th className="py-4 px-6">Keperluan/Objek</th>
								<th className="py-4 px-6 text-center">No. Agenda</th>
								<th className="py-4 px-6 text-center">No. SO</th>
								<th className="py-4 px-6 text-center">Nominal</th>
								<th className="py-4 px-6 text-center">Status</th>
								<th className="py-4 px-6 text-center">Status Bukti</th>
								<th className="py-4 px-6 text-center">Status Pembayaran</th>
								<th className="py-4 px-6 text-center">Tanggal Pembayaran</th>
								<th className="py-4 px-6 rounded-tr-2xl text-center">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{loading ? (
								<tr><td colSpan={13} className="text-center py-20 text-gray-400">Memproses data BKI...</td></tr>
							) : pagedPds.length === 0 ? (
								<tr><td colSpan={13} className="text-center py-20 text-gray-400">Belum ada PDS bernominal untuk direkap.</td></tr>
							) : (
								pagedPds.map((data: any) => {
									const statusPds = getPdsStatusSummary(data.status);
									const statusBukti = getBuktiSummary(data.bukti || []);
									return (
									<tr key={data.id} className="hover:bg-gray-50/80 transition-colors">
										<td className="py-4 px-6 font-bold text-gray-900">{data.user?.nama || data.user?.name}</td>
										<td className="py-4 px-6 uppercase font-medium">{data.lokasi}</td>
										<td className="py-4 px-6 text-center">{formatDate(data.tglBerangkat)}</td>
										<td className="py-4 px-6 text-center uppercase">{data.permohonan || 'PDS'}</td>
										<td className="py-4 px-6 max-w-[200px] truncate uppercase italic text-gray-500">{data.keperluan}</td>
										<td className="py-4 px-6 text-center font-semibold text-gray-700">{data.noAgenda || '-'}</td>
										<td className="py-4 px-6 text-center font-semibold text-gray-700">{data.so || '-'}</td>
										<td className="py-4 px-6 text-center font-black text-teal-700 whitespace-nowrap">{formatRupiah(Number(data.nominalPDS) || 0)}</td>
										<td className="py-4 px-6 text-center">
											<span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap ${statusPds.className}`}>
												{statusPds.label}
											</span>
										</td>
										<td className="py-4 px-6 text-center">
											<span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold whitespace-nowrap ${statusBukti.className}`}>
												{statusBukti.label}
											</span>
										</td>
										<td className="py-4 px-6 text-center">
											<span
												className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap inline-flex items-center justify-center ${
													data.statusPembayaran === 'SUDAH_DIBAYAR'
														? 'bg-green-50 text-green-700'
														: 'bg-red-50 text-red-600'
												}`}
											>
												{data.statusPembayaran === 'SUDAH_DIBAYAR' ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR'}
											</span>
										</td>
										<td className="py-4 px-6 text-center whitespace-nowrap">
											{formatDate(data.tanggalPembayaran)}
										</td>
										<td className="py-4 px-6">
											<div className="flex justify-center gap-2">
												<button
													onClick={() => setPreviewData(data)}
													className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all shadow-sm"
													title="Lihat Surat"
												>
													<FileText size={18} />
												</button>
												<button
													onClick={() => openPaymentModal(data)}
													disabled={data.statusPembayaran === 'SUDAH_DIBAYAR' || processingPaymentId === data.id}
													className={`p-2 rounded-xl transition-all shadow-sm ${
														data.statusPembayaran === 'SUDAH_DIBAYAR'
															? 'bg-green-100 text-green-700 cursor-not-allowed'
															: 'bg-emerald-500 text-white hover:bg-emerald-600'
													}`}
													title={data.statusPembayaran === 'SUDAH_DIBAYAR' ? 'Sudah ditransfer' : 'Konfirmasi Transfer'}
												>
													<Check size={18} />
												</button>
											</div>
										</td>
									</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
					<p className="text-xs font-semibold text-gray-500">
						Menampilkan {pagedPds.length} dari {filteredPds.length} data
					</p>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold text-gray-600">Baris</span>
							<select
								value={pageSize}
								onChange={(e) => {
									setPageSize(Number(e.target.value));
									setCurrentPage(1);
								}}
								className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-600"
							>
								{[10, 20, 50].map((size) => (
									<option key={size} value={size}>{size}</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 disabled:opacity-50"
							>
								Prev
							</button>
							<span className="text-xs font-semibold text-gray-600">{currentPage} / {totalPages}</span>
							<button
								onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
								className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 disabled:opacity-50"
							>
								Next
							</button>
						</div>
					</div>
				</div>
			</div>

			{paymentTarget && (
				<div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 px-4 py-6">
					<div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
						<div className="mb-5 flex items-start justify-between gap-4">
							<div>
								<h2 className="text-xl font-black text-[#202c45]">Konfirmasi Pembayaran</h2>
								<p className="mt-1 text-sm text-gray-500">
									{paymentTarget.user?.nama || paymentTarget.user?.name || 'Surveyor'} - {paymentTarget.noAgenda || '-'}
								</p>
							</div>
							<button
								type="button"
								onClick={closePaymentModal}
								className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-500"
							>
								<XCircle size={22} />
							</button>
						</div>

						<div className="space-y-4">
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<p className="text-[10px] font-bold uppercase text-slate-400">No. SO</p>
										<p className="mt-1 font-semibold text-slate-800">{paymentTarget.so || '-'}</p>
									</div>
									<div>
										<p className="text-[10px] font-bold uppercase text-slate-400">Nominal</p>
										<p className="mt-1 font-semibold text-slate-800">{formatRupiah(Number(paymentTarget.nominalPDS) || 0)}</p>
									</div>
								</div>
							</div>

							<label className="block">
								<span className="mb-1 block text-xs font-bold uppercase text-gray-600">Tanggal Pembayaran</span>
								<input
									type="date"
									value={paymentDate}
									onChange={(e) => setPaymentDate(e.target.value)}
									className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
									required
								/>
							</label>

							<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
								<button
									type="button"
									onClick={closePaymentModal}
									className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
								>
									Batal
								</button>
								<button
									type="button"
									onClick={handleMarkAsPaid}
									disabled={processingPaymentId === paymentTarget.id}
									className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{processingPaymentId === paymentTarget.id ? 'Menyimpan...' : 'Konfirmasi Bayar'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

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
