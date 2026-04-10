"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Loader2, RefreshCcw, ShieldPlus, UserRound } from "lucide-react";

type SurveyorUser = {
	id: number;
	nama: string;
	email: string;
	username: string;
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
	noTelp: string;
	jenisBank: string;
	noRekening: string;
};

const initialForm: FormState = {
	nama: "",
	email: "",
	username: "",
	password: "",
	noTelp: "",
	jenisBank: "",
	noRekening: "",
};

export default function AdminPenggunaPage() {
	const [users, setUsers] = useState<SurveyorUser[]>([]);
	const [form, setForm] = useState<FormState>(initialForm);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
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
						<input
							type="text"
							placeholder="Nama lengkap"
							value={form.nama}
							onChange={(e) => onChangeInput("nama", e.target.value)}
							className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
						/>
						<input
							type="email"
							placeholder="Email"
							value={form.email}
							onChange={(e) => onChangeInput("email", e.target.value)}
							className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
						/>
						<input
							type="text"
							placeholder="Username"
							value={form.username}
							onChange={(e) => onChangeInput("username", e.target.value)}
							className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
						/>
						<input
							type="password"
							placeholder="Password"
							value={form.password}
							onChange={(e) => onChangeInput("password", e.target.value)}
							className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
						/>

						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<input
								type="text"
								placeholder="No. Telepon"
								value={form.noTelp}
								onChange={(e) => onChangeInput("noTelp", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
							<input
								type="text"
								placeholder="Jenis Bank"
								value={form.jenisBank}
								onChange={(e) => onChangeInput("jenisBank", e.target.value)}
								className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
							/>
						</div>

						<input
							type="text"
							placeholder="No. Rekening"
							value={form.noRekening}
							onChange={(e) => onChangeInput("noRekening", e.target.value)}
							className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
						/>

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
									<th className="px-4 py-3">No. Telp</th>
									<th className="rounded-r-xl px-4 py-3">Bank / Rekening</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td colSpan={5} className="px-4 py-10 text-center text-gray-400">
											<span className="inline-flex items-center gap-2">
												<Loader2 className="animate-spin" size={16} />
												Memuat data pengguna...
											</span>
										</td>
									</tr>
								) : users.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-4 py-10 text-center text-gray-400">Belum ada akun surveyor.</td>
									</tr>
								) : (
									users.map((user) => (
										<tr key={user.id} className="border-b border-gray-100 text-gray-700">
											<td className="px-4 py-3 font-semibold text-gray-900">{user.nama}</td>
											<td className="px-4 py-3">{user.email}</td>
											<td className="px-4 py-3">{user.username}</td>
											<td className="px-4 py-3">{user.noTelp || "-"}</td>
											<td className="px-4 py-3">{user.jenisBank || user.noRekening ? `${user.jenisBank || "-"} / ${user.noRekening || "-"}` : "-"}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</div>
	);
}
