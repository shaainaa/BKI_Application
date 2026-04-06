"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, FileText, XCircle } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { PdsTemplate } from '@/components/PdsTemplate';

export default function AdminRiwayatPDSPage() {
	const [listPds, setListPds] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [previewData, setPreviewData] = useState<any>(null);
	const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);

	const [filters, setFilters] = useState({
		nama: '',
		lokasi: '',
		permohonan: '',
		tanggalMulai: '',
		tanggalAkhir: '',
		keperluan: '',
		statusPembayaran: '',
		tanggalPembayaran: '',
	});

	const fetchCompletedPds = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/admin/pds');
			const result = await res.json();

			if (result.success) {
				const completedOnly = (result.data || []).filter((item: any) => item.status === 'COMPLETED');
				setListPds(completedOnly);
			}
		} catch (err) {
			console.error('Gagal mengambil riwayat PDS:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCompletedPds();
	}, []);

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
			const itemDate = formatDateInput(item.tanggalPengajuan);
			const itemPaymentDate = formatDateInput(item.tanggalPembayaran);
			const paymentStatus = item.statusPembayaran || 'BELUM_DIBAYAR';

			const matchNama = !filters.nama || namaUser === filters.nama.toLowerCase();
			const matchLokasi = !filters.lokasi || lokasi === filters.lokasi.toLowerCase();
			const matchPermohonan = !filters.permohonan || permohonan === filters.permohonan.toLowerCase();
			const matchTanggalMulai = !filters.tanggalMulai || itemDate >= filters.tanggalMulai;
			const matchTanggalAkhir = !filters.tanggalAkhir || itemDate <= filters.tanggalAkhir;
			const matchKeperluan = !filters.keperluan || keperluan === filters.keperluan.toLowerCase();
			const matchStatusPembayaran = !filters.statusPembayaran || paymentStatus === filters.statusPembayaran;
			const matchTanggalPembayaran = !filters.tanggalPembayaran || itemPaymentDate === filters.tanggalPembayaran;

			return (
				matchNama &&
				matchLokasi &&
				matchPermohonan &&
				matchTanggalMulai &&
				matchTanggalAkhir &&
				matchKeperluan &&
				matchStatusPembayaran &&
				matchTanggalPembayaran
			);
		});
	}, [listPds, filters]);

	const handleMarkAsPaid = async (id: number) => {
		if (!confirm('Konfirmasi transfer pembayaran untuk data ini?')) return;

		setProcessingPaymentId(id);
		try {
			const nowIso = new Date().toISOString();
			const res = await fetch('/api/admin/pds', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id,
					statusPembayaran: 'SUDAH_DIBAYAR',
					tanggalPembayaran: nowIso,
				}),
			});

			const result = await res.json();
			if (!result.success) {
				alert(result.error || 'Gagal memperbarui status pembayaran.');
				return;
			}

			setListPds((prev) =>
				prev.map((item) =>
					item.id === id
						? { ...item, statusPembayaran: 'SUDAH_DIBAYAR', tanggalPembayaran: nowIso }
						: item
				)
			);
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

	const getDayOnly = (dateString: string) => {
		if (!dateString) return '-';
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return '-';
		return String(date.getDate()).padStart(2, '0');
	};

	const handleExportExcel = async () => {
		if (filteredPds.length === 0) {
			alert('Tidak ada data untuk diexport.');
			return;
		}

		if (filters.tanggalMulai && filters.tanggalAkhir && filters.tanggalMulai > filters.tanggalAkhir) {
			alert('Tanggal pengajuan mulai tidak boleh lebih besar dari tanggal pengajuan akhir.');
			return;
		}

		const exportData = [...filteredPds].sort(
			(a: any, b: any) => new Date(a.tanggalPengajuan).getTime() - new Date(b.tanggalPengajuan).getTime()
		);

		const XLSX = await import('xlsx');

		const excelRows = exportData.map((item: any) => {
			const jenis = (item.permohonan || '').toUpperCase();
			const { month, year } = getMonthAndYear(item.tanggalPengajuan);
			const nomorPdsTrans = item.nomorPdsTrans || '-';

			return {
				'No. Transportasi': jenis === 'TRANSPORTASI' ? nomorPdsTrans : '-',
				'No. PDS': jenis !== 'TRANSPORTASI' ? nomorPdsTrans : '-',
				Bulan: month,
				Tahun: year,
				Tanggal: getDayOnly(item.tanggalPengajuan),
				Lokasi: item.lokasi || '-',
				Jenis: jenis || '-',
				Nama: item.user?.nama || item.user?.name || '-',
				Keperluan: item.keperluan || '-',
				Nominal: item.nominalPDS || '-',
				SPS: item.sps || item.noAgenda || '-',
				SO: item.so || '-',
				'Visit Ke': item.visitKe || '-',
				'Status Pembayaran': item.statusPembayaran === 'SUDAH_DIBAYAR' ? 'Sudah Dibayar' : 'Belum Dibayar',
				'Tanggal Pembayaran': formatDate(item.tanggalPembayaran),
			};
		});

		const worksheet = XLSX.utils.json_to_sheet(excelRows);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat PDS');

		const today = new Date().toISOString().slice(0, 10);
		XLSX.writeFile(workbook, `riwayat-pds-${today}.xlsx`);
	};

	return (
		<div className="p-8 bg-[#f8f9fa] min-h-screen font-sans">
			<h1 className="text-[40px] font-bold text-[#202c45] mb-8 tracking-tight">Riwayat PDS</h1>

			<div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
				<div className="mb-6">
					<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
						<p className="font-semibold text-gray-700 text-sm">Filter</p>
						<button
							onClick={handleExportExcel}
							className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
						>
							<Download size={14} /> Export Excel
						</button>
					</div>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Nama Surveyor</label>
								<select
									value={filters.nama}
									onChange={(e) => setFilters((prev) => ({ ...prev, nama: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
								>
									<option value="">Semua Nama</option>
									{filterOptions.nama.map((item) => (
										<option key={item} value={item}>{item}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Lokasi</label>
								<select
									value={filters.lokasi}
									onChange={(e) => setFilters((prev) => ({ ...prev, lokasi: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
								>
									<option value="">Semua Lokasi</option>
									{filterOptions.lokasi.map((item) => (
										<option key={item} value={item}>{item}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Jenis</label>
								<select
									value={filters.permohonan}
									onChange={(e) => setFilters((prev) => ({ ...prev, permohonan: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
								>
									<option value="">Semua Jenis</option>
									{filterOptions.permohonan.map((item) => (
										<option key={item} value={item}>{item}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Tanggal Pengajuan Mulai</label>
								<input
									type="date"
									value={filters.tanggalMulai}
									onChange={(e) => setFilters((prev) => ({ ...prev, tanggalMulai: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 text-gray-600 outline-none focus:border-teal-500"
								/>
							</div>
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Tanggal Pengajuan Akhir</label>
								<input
									type="date"
									value={filters.tanggalAkhir}
									onChange={(e) => setFilters((prev) => ({ ...prev, tanggalAkhir: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 text-gray-600 outline-none focus:border-teal-500"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Keperluan</label>
								<select
									value={filters.keperluan}
									onChange={(e) => setFilters((prev) => ({ ...prev, keperluan: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
								>
									<option value="">Semua Keperluan</option>
									{filterOptions.keperluan.map((item) => (
										<option key={item} value={item}>{item}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Status Pembayaran</label>
								<select
									value={filters.statusPembayaran}
									onChange={(e) => setFilters((prev) => ({ ...prev, statusPembayaran: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 bg-white text-gray-600 outline-none focus:border-teal-500 appearance-none"
								>
									<option value="">Semua Status Pembayaran</option>
									<option value="BELUM_DIBAYAR">Belum Dibayar</option>
									<option value="SUDAH_DIBAYAR">Sudah Dibayar</option>
								</select>
							</div>
							<div>
								<label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Tanggal Pembayaran</label>
								<input
									type="date"
									value={filters.tanggalPembayaran}
									onChange={(e) => setFilters((prev) => ({ ...prev, tanggalPembayaran: e.target.value }))}
									className="w-full border border-gray-300 rounded-full px-5 py-2.5 text-gray-600 outline-none focus:border-teal-500"
								/>
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
								<th className="py-4 px-6">Keperluan</th>
								<th className="py-4 px-6 text-center">Status</th>
								<th className="py-4 px-6 text-center">Status Pembayaran</th>
								<th className="py-4 px-6 text-center">Tanggal Pembayaran</th>
								<th className="py-4 px-6 rounded-tr-2xl text-center">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{loading ? (
								<tr><td colSpan={9} className="text-center py-20 text-gray-400">Memproses data BKI...</td></tr>
							) : filteredPds.length === 0 ? (
								<tr><td colSpan={9} className="text-center py-20 text-gray-400">Belum ada riwayat PDS selesai.</td></tr>
							) : (
								filteredPds.map((data: any) => (
									<tr key={data.id} className="hover:bg-gray-50/80 transition-colors">
										<td className="py-4 px-6 font-bold text-gray-900">{data.user?.nama || data.user?.name}</td>
										<td className="py-4 px-6 uppercase font-medium">{data.lokasi}</td>
										<td className="py-4 px-6 text-center">{formatDate(data.tanggalPengajuan)}</td>
										<td className="py-4 px-6 text-center uppercase">{data.permohonan || 'PDS'}</td>
										<td className="py-4 px-6 max-w-[200px] truncate uppercase italic text-gray-500">{data.keperluan}</td>
										<td className="py-4 px-6 text-center">
											<span className="px-6 py-1 rounded-full text-[10px] font-black tracking-widest bg-green-50 text-teal-700">
												COMPLETE
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
													onClick={() => handleMarkAsPaid(data.id)}
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
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

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
