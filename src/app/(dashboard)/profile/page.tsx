"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

type UserProfile = {
  id: number;
  nama: string;
  email: string;
  username: string;
  noTelp?: string | null;
  jenisBank?: string | null;
  noRekening?: string | null;
  jabatanSurveyor?: string | null;
  role: 'SURVEYOR' | 'ADMIN';
};

type ProfileForm = {
  nama: string;
  email: string;
  username: string;
  noTelp: string;
  jenisBank: string;
  noRekening: string;
  jabatanSurveyor: string;
  currentPassword: string;
  newPassword: string;
};

const initialForm: ProfileForm = {
  nama: '',
  email: '',
  username: '',
  noTelp: '',
  jenisBank: '',
  noRekening: '',
  jabatanSurveyor: '',
  currentPassword: '',
  newPassword: '',
};

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isChangingPassword = useMemo(() => form.newPassword.trim().length > 0, [form.newPassword]);

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const user = JSON.parse(userRaw || '{}');

    if (!user.id) {
      router.push('/login');
      return;
    }

    setCurrentUserId(Number(user.id));
  }, [router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/profile?userId=${currentUserId}`, { cache: 'no-store' });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Gagal mengambil profil.');
        }

        const data = result.data as UserProfile;
        setForm((prev) => ({
          ...prev,
          nama: data.nama || '',
          email: data.email || '',
          username: data.username || '',
          noTelp: data.noTelp || '',
          jenisBank: data.jenisBank || '',
          noRekening: data.noRekening || '',
          jabatanSurveyor: data.jabatanSurveyor || '',
          currentPassword: '',
          newPassword: '',
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat profil.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUserId]);

  const onInput = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!form.nama.trim()) return 'Nama wajib diisi.';
    if (!form.username.trim()) return 'Username wajib diisi.';

    if (isChangingPassword) {
      if (!form.currentPassword.trim()) return 'Password saat ini wajib diisi.';
      if (form.newPassword.trim().length < 6) return 'Password baru minimal 6 karakter.';
    }

    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUserId) {
      return;
    }

    setMessage('');
    setError('');

    const formError = validateForm();
    if (formError) {
      setError(formError);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          nama: form.nama.trim(),
          username: form.username.trim(),
          noTelp: form.noTelp.trim(),
          jenisBank: form.jenisBank.trim(),
          noRekening: form.noRekening.trim(),
          jabatanSurveyor: form.jabatanSurveyor.trim(),
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal memperbarui profil.');
      }

      const latestUser = result.data as UserProfile;
      const localUserRaw = localStorage.getItem('user');
      const localUser = JSON.parse(localUserRaw || '{}');
      localStorage.setItem('user', JSON.stringify({ ...localUser, ...latestUser }));

      setMessage('Profil berhasil diperbarui.');
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan profil.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#202c45]">Profil Saya</h1>
        <p className="mt-1 text-sm text-gray-500">Perbarui data pribadi dan ganti password Anda. Email tidak dapat diubah.</p>
      </div>

      <div className="max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Memuat profil...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">Nama Lengkap</span>
                <input
                  type="text"
                  placeholder="Nama lengkap"
                  value={form.nama}
                  onChange={(e) => onInput('nama', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">Username</span>
                <input
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => onInput('username', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                />
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-gray-600">Email (Tidak Bisa Diubah)</span>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-500"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">Jabatan Surveyor</span>
                <input
                  type="text"
                  placeholder="Jabatan"
                  value={form.jabatanSurveyor}
                  onChange={(e) => onInput('jabatanSurveyor', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">Nomor Telepon</span>
                <input
                  type="text"
                  placeholder="No. Telepon"
                  value={form.noTelp}
                  onChange={(e) => onInput('noTelp', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">Jenis Bank</span>
                <input
                  type="text"
                  placeholder="Jenis Bank"
                  value={form.jenisBank}
                  onChange={(e) => onInput('jenisBank', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">Nomor Rekening</span>
                <input
                  type="text"
                  placeholder="No. Rekening"
                  value={form.noRekening}
                  onChange={(e) => onInput('noRekening', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h2 className="text-sm font-semibold text-[#202c45]">Ubah Password</h2>
              <p className="mt-1 text-xs text-gray-500">Isi bagian ini jika ingin mengganti password.</p>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600">Password Saat Ini</span>
                  <input
                    type="password"
                    placeholder="Password saat ini"
                    value={form.currentPassword}
                    onChange={(e) => onInput('currentPassword', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600">Password Baru</span>
                  <input
                    type="password"
                    placeholder="Password baru"
                    value={form.newPassword}
                    onChange={(e) => onInput('newPassword', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#0A8E9A]"
                  />
                </label>
              </div>
            </div>

            {message ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A8E9A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#087985] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
