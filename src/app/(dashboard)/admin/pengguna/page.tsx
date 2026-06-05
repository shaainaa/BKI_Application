"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Edit2, Loader2, RefreshCcw, ShieldPlus, Trash2, UserRound, X } from "lucide-react";

type SurveyorUser = {
	id: number;
	nama: string;
	email: string;
	username: string;
	jabatanSurveyor?: string | null;
	noTelp?: string | null;
	jenisBank?: string | null;
	noRekening?: string | null;
	role: "SURVEYOR" | "ADMIN";
};

type FormState = {
	nama: string;
	email: string;
	username: string;
	password: string;
	jabatanSurveyor: string;
	noTelp: string;
	jenisBank: string;
	noRekening: string;
};

const initialForm: FormState = {
	nama: "",
	email: "",
	username: "",
	password: "",
	jabatanSurveyor: "",
	noTelp: "",
	jenisBank: "",
	noRekening: "",
};

export default function AdminPenggunaPage() {
	const [users, setUsers] = useState<SurveyorUser[]>([]);
	const [form, setForm] = useState<FormState>(initialForm);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingUser, setEditingUser] = useState<SurveyorUser | null>(null);
	const [editForm, setEditForm] = useState<FormState>(initialForm);
	const [updating, setUpdating] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [message, setMessage] = useState<string>("");
	const [error, setError] = useState<string>("");

	const fetchSurveyorUsers = async () => {
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/admin/users", { cache: "no-store" });
			const result = await res.json();

			if (!res.ok || !result.success) {
				throw new Error(result.error || "Gagal mengambil daftar pengguna.");
			}

			setUsers(result.data || []);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data pengguna.";
			setError(msg);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSurveyorUsers();
	}, []);

	const onChangeInput = (key: keyof FormState, value: string) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const onChangeEditInput = (key: keyof FormState, value: string) => {
		setEditForm((prev) => ({ ...prev, [key]: value }));
	};

	const openEditModal = (user: SurveyorUser) => {
		setMessage("");
		setError("");
		setEditingUser(user);
		setEditForm({
			nama: user.nama || "",
			email: user.email || "",
			username: user.username || "",
			password: "",
			jabatanSurveyor: user.jabatanSurveyor || "",
			noTelp: user.noTelp || "",
			jenisBank: user.jenisBank || "",
			noRekening: user.noRekening || "",
		});
	};

	const closeEditModal = () => {
		setEditingUser(null);
		setEditForm(initialForm);
	};

	const validateForm = () => {
		if (!form.nama.trim()) return "Nama wajib diisi.";
		if (!form.email.trim()) return "Email wajib diisi.";
		if (!form.username.trim()) return "Username wajib diisi.";
		if (!form.password.trim()) return "Password wajib diisi.";
		if (form.password.trim().length < 6) return "Password minimal 6 karakter.";
		return "";
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setMessage("");
		setError("");

		const formError = validateForm();
		if (formError) {
			setError(formError);
			return;
		}

		setSaving(true);

		try {
			const res = await fetch("/api/admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nama: form.nama.trim(),
					email: form.email.trim(),
					username: form.username.trim(),
					password: form.password,
					jabatanSurveyor: form.jabatanSurveyor.trim(),
					noTelp: form.noTelp.trim(),
					jenisBank: form.jenisBank.trim(),
					noRekening: form.noRekening.trim(),
				}),
			});

			const result = await res.json();
			if (!res.ok || !result.success) {
				throw new Error(result.error || "Gagal membuat akun surveyor.");
			}

			setMessage("Akun surveyor berhasil dibuat.");
			setForm(initialForm);
			await fetchSurveyorUsers();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat akun.";
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	const validateEditForm = () => {
		if (!editForm.nama.trim()) return "Nama wajib diisi.";
		if (!editForm.email.trim()) return "Email wajib diisi.";
		if (!editForm.username.trim()) return "Username wajib diisi.";
		if (editForm.password.trim() && editForm.password.trim().length < 6) return "Password baru minimal 6 karakter.";
		return "";
	};

	const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!editingUser) {
			return;
		}

		setMessage("");
		setError("");

		const formError = validateEditForm();
		if (formError) {
			setError(formError);
			return;
		}

		setUpdating(true);

		try {
			const res = await fetch("/api/admin/users", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: editingUser.id,
					nama: editForm.nama.trim(),
					email: editForm.email.trim(),
					username: editForm.username.trim(),
					password: editForm.password.trim(),
					jabatanSurveyor: editForm.jabatanSurveyor.trim(),
					noTelp: editForm.noTelp.trim(),
					jenisBank: editForm.jenisBank.trim(),
					noRekening: editForm.noRekening.trim(),
				}),
			});

			const result = await res.json();
			if (!res.ok || !result.success) {
				throw new Error(result.error || "Gagal memperbarui akun surveyor.");
			}

			setMessage(editForm.password.trim() ? "Data dan password surveyor berhasil diperbarui." : "Data surveyor berhasil diperbarui.");
			closeEditModal();
			await fetchSurveyorUsers();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui akun.";
			setError(msg);
		} finally {
			setUpdating(false);
		}
	};

	const handleDelete = async (user: SurveyorUser) => {
		const confirmed = window.confirm(`Hapus akun surveyor "${user.nama}"?`);
		if (!confirmed) {
			return;
		}

		setMessage("");
		setError("");
		setDeletingId(user.id);

		try {
			const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
			const result = await res.json();

			if (!res.ok || !result.success) {
				throw new Error(result.error || "Gagal menghapus akun surveyor.");
			}

			setMessage("Akun surveyor berhasil dihapus.");
			await fetchSurveyorUsers();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus akun.";
			setError(msg);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="min-h-screen bg-[#f8f9fa] font-sans">
			<div className="mb-8 flex items-center gap-3">
				<div className="rounded-2xl bg-teal-100 p-3 text-[#0A8E9A]">
					<UserRound size={24} />
				</div>
				<div>
					<h1 className="text-3xl font-bold text-[#202c45]">Manajemen Pengguna Surveyor</h1>
					<p className="text-sm text-gray-500">Admin dapat membuat akun baru untuk surveyor dan memantau akun yang sudah aktif.</p>
				</div>
			</div>

			<section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
				<div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
					<div className="mb-6 flex items-center gap-2">
						<ShieldPlus className="text-[#0A8E9A]" size={20} />
						<h2 className="text-lg font-semibold text-[#202c45]">Buat Akun Surveyor</h2>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<label className="block space-y-1">
							<span className="text-xs font-semibold text-gray-600">Nama Lengkap</span>
							<input
								type="text"
								placeholder="Nama lengkap"
								value={form.nama}
								onChange={(e) => onChangeInput("nama", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
						</label>
						<label className="block space-y-1">
							<span className="text-xs font-semibold text-gray-600">Email</span>
							<input
								type="email"
								placeholder="Email"
								value={form.email}
								onChange={(e) => onChangeInput("email", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
						</label>
						<label className="block space-y-1">
							<span className="text-xs font-semibold text-gray-600">Username</span>
							<input
								type="text"
								placeholder="Username"
								value={form.username}
								onChange={(e) => onChangeInput("username", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
						</label>
						<label className="block space-y-1">
							<span className="text-xs font-semibold text-gray-600">Jabatan Surveyor</span>
							<input
								type="text"
								placeholder="Jabatan Surveyor (contoh: Surveyor Ahli)"
								value={form.jabatanSurveyor}
								onChange={(e) => onChangeInput("jabatanSurveyor", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
						</label>
						<label className="block space-y-1">
							<span className="text-xs font-semibold text-gray-600">Password</span>
							<input
								type="password"
								placeholder="Password"
								value={form.password}
								onChange={(e) => onChangeInput("password", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
						</label>

						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<label className="block space-y-1">
								<span className="text-xs font-semibold text-gray-600">Nomor Telepon</span>
								<input
									type="text"
									placeholder="No. Telepon"
									value={form.noTelp}
									onChange={(e) => onChangeInput("noTelp", e.target.value)}
									className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
								/>
							</label>
							<label className="block space-y-1">
								<span className="text-xs font-semibold text-gray-600">Jenis Bank</span>
								<input
									type="text"
									placeholder="Jenis Bank"
									value={form.jenisBank}
									onChange={(e) => onChangeInput("jenisBank", e.target.value)}
									className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
								/>
							</label>
						</div>

						<label className="block space-y-1">
							<span className="text-xs font-semibold text-gray-600">Nomor Rekening</span>
							<input
								type="text"
								placeholder="No. Rekening"
								value={form.noRekening}
								onChange={(e) => onChangeInput("noRekening", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
						</label>

						{message ? (
							<div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>
						) : null}
						{error ? (
							<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
						) : null}

						<button
							type="submit"
							disabled={saving}
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A8E9A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#087985] disabled:cursor-not-allowed disabled:opacity-70"
						>
							{saving ? <Loader2 className="animate-spin" size={18} /> : null}
							{saving ? "Menyimpan..." : "Buat Akun Surveyor"}
						</button>
					</form>
				</div>

				<div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-3">
					<div className="mb-4 flex items-center justify-between gap-2">
						<h2 className="text-lg font-semibold text-[#202c45]">Daftar Surveyor</h2>
						<button
							type="button"
							onClick={fetchSurveyorUsers}
							className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
						>
							<RefreshCcw size={16} />
							Refresh
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[680px] border-collapse text-sm">
							<thead>
								<tr className="bg-[#ecf4f7] text-left text-[#202c45]">
									<th className="rounded-l-xl px-4 py-3">Nama</th>
									<th className="px-4 py-3">Email</th>
									<th className="px-4 py-3">Username</th>
									<th className="px-4 py-3">Jabatan</th>
									<th className="px-4 py-3">No. Telp</th>
									<th className="px-4 py-3">Bank / Rekening</th>
									<th className="rounded-r-xl px-4 py-3 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td colSpan={7} className="px-4 py-10 text-center text-gray-400">
											<span className="inline-flex items-center gap-2">
												<Loader2 className="animate-spin" size={16} />
												Memuat data pengguna...
											</span>
										</td>
									</tr>
								) : users.length === 0 ? (
									<tr>
										<td colSpan={7} className="px-4 py-10 text-center text-gray-400">Belum ada akun surveyor.</td>
									</tr>
								) : (
									users.map((user) => (
										<tr key={user.id} className="border-b border-gray-100 text-gray-700">
											<td className="px-4 py-3 font-semibold text-gray-900">{user.nama}</td>
											<td className="px-4 py-3">{user.email}</td>
											<td className="px-4 py-3">{user.username}</td>
											<td className="px-4 py-3">{user.jabatanSurveyor || "-"}</td>
											<td className="px-4 py-3">{user.noTelp || "-"}</td>
											<td className="px-4 py-3">{user.jenisBank || user.noRekening ? `${user.jenisBank || "-"} / ${user.noRekening || "-"}` : "-"}</td>
											<td className="px-4 py-3">
												<div className="flex justify-end gap-2">
													<button
														type="button"
														onClick={() => openEditModal(user)}
														className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-3 py-2 text-xs font-semibold text-[#0A8E9A] transition hover:bg-teal-50"
													>
														<Edit2 size={14} />
														Edit
													</button>
													<button
														type="button"
														onClick={() => handleDelete(user)}
														disabled={deletingId === user.id}
														className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
													>
														{deletingId === user.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
														Hapus
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
			</section>

			{editingUser ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
					<div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
						<div className="mb-5 flex items-start justify-between gap-4">
							<div>
								<h2 className="text-xl font-bold text-[#202c45]">Edit Akun Surveyor</h2>
								<p className="mt-1 text-sm text-gray-500">Kosongkan password jika tidak ingin menggantinya.</p>
							</div>
							<button
								type="button"
								onClick={closeEditModal}
								className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleUpdate} className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Nama Lengkap</span>
									<input
										type="text"
										value={editForm.nama}
										onChange={(e) => onChangeEditInput("nama", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Email</span>
									<input
										type="email"
										value={editForm.email}
										onChange={(e) => onChangeEditInput("email", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Username</span>
									<input
										type="text"
										value={editForm.username}
										onChange={(e) => onChangeEditInput("username", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Password Baru</span>
									<input
										type="password"
										placeholder="Minimal 6 karakter"
										value={editForm.password}
										onChange={(e) => onChangeEditInput("password", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Jabatan Surveyor</span>
									<input
										type="text"
										value={editForm.jabatanSurveyor}
										onChange={(e) => onChangeEditInput("jabatanSurveyor", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Nomor Telepon</span>
									<input
										type="text"
										value={editForm.noTelp}
										onChange={(e) => onChangeEditInput("noTelp", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Jenis Bank</span>
									<input
										type="text"
										value={editForm.jenisBank}
										onChange={(e) => onChangeEditInput("jenisBank", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-xs font-semibold text-gray-600">Nomor Rekening</span>
									<input
										type="text"
										value={editForm.noRekening}
										onChange={(e) => onChangeEditInput("noRekening", e.target.value)}
										className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
									/>
								</label>
							</div>

							<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
								<button
									type="button"
									onClick={closeEditModal}
									className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={updating}
									className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A8E9A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#087985] disabled:cursor-not-allowed disabled:opacity-70"
								>
									{updating ? <Loader2 className="animate-spin" size={16} /> : null}
									{updating ? "Menyimpan..." : "Simpan Perubahan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
}
