"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const mapLoginErrorMessage = (status: number, message?: string) => {
    if (status === 401) return 'Username atau password salah.';
    if (status === 503) return 'Layanan login sedang gangguan. Silakan coba lagi beberapa saat.';
    if (status >= 500) return 'Terjadi gangguan server. Silakan coba lagi nanti.';
    if (message && message.trim()) return message;
    return 'Login gagal. Silakan cek kembali data Anda.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' }
      });

      const contentType = res.headers.get('content-type') || '';
      const isJsonResponse = contentType.includes('application/json');
      const data = isJsonResponse ? await res.json() : null;

      if (res.ok && data?.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        } 
      } else {
        if (isJsonResponse) {
          setError(mapLoginErrorMessage(res.status, data?.message || data?.error));
        } else {
          setError(mapLoginErrorMessage(res.status));
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      const isNetworkError = /failed to fetch|network|load failed/i.test(message);
      setError(isNetworkError ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' : 'Gagal memproses permintaan login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans" style={{ background: 'var(--color-bg-light)' }}>
      {/* Container Utama */}
      <div className="flex w-full max-w-4xl rounded-[2rem] overflow-hidden min-h-[600px]" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Kolom Kiri: Gambar Background (Hidden di Mobile) */}
        <div className="hidden md:block md:w-1/2 relative">
          <Image
            src="/images/Foto Login.png"
            alt="Surveyor BKI"
            fill
            sizes="(min-width: 768px) 50vw, 0vw"
            className="absolute inset-0 w-full h-full object-cover"
            priority
          />
          {/* Overlay gradasi agar gambar lebih menyatu dengan desain */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--color-primary)/20, var(--color-accent)/10)' }}></div>
        </div>

        {/* Kolom Kanan: Form Login */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
          <div>
            {/* Logo Section */}
            <div className="flex justify-center items-center md:justify-center mb-10">
              <Image src="/images/BKI.png" alt="Logo BKI" width={200} height={80} className="h-20 w-auto object-contain" priority />
            </div>

            {/* Header Text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Selamat Datang</h2>
              <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">Silakan masukkan akun Anda untuk melanjutkan</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger mb-6" role="alert" aria-live="polite">
                <span className="font-semibold">Login Gagal:</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Input */}
              <div className="space-y-1">
                <label htmlFor="username" className="text-[10px] font-bold uppercase tracking-[0.1em] ml-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Username <span aria-label="required">*</span>
                </label>
                <input 
                  id="username"
                  type="text" 
                  placeholder="Masukkan username Anda"
                  className="w-full p-3 text-sm transition-all"
                  style={{ background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  required 
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.1em] ml-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Password <span aria-label="required">*</span>
                </label>
                <div className="relative">
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Masukkan password Anda"
                    className="w-full p-3 text-sm transition-all pr-12"
                    style={{ background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    required 
                  />
                  {/* Toggle Password Visibility */}
                  <button 
                    type="button" 
                    className="absolute right-3 top-3 transition-colors p-1 rounded-md focus:outline-2 focus:outline-offset-1"
                    style={{ color: 'var(--color-text-secondary)', outlineColor: 'var(--color-primary)' }}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.67 8.5 7.652 6 12 6c4.348 0 8.332 2.5 9.964 5.678a1.012 1.012 0 0 1 0 .644C20.33 15.5 16.348 18 12 18c-4.348 0-8.332-2.5-9.964-5.678Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <a 
                    href="#" 
                    className="text-[11px] font-medium hover:underline focus:outline-2 focus:outline-offset-1 rounded px-1 py-0.5 inline-block transition-colors" 
                    style={{ color: 'var(--color-primary)', outlineColor: 'var(--color-primary)' }}
                    aria-label="Lupa password? Reset password akun Anda"
                  >
                    Lupa password?
                  </a>
                </div>
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-[0.98] flex justify-center items-center"
                aria-busy={isLoading}
                aria-label={isLoading ? 'Sedang login, harap tunggu' : 'Login dengan username dan password'}
                style={{ opacity: isLoading ? '0.7' : '1', cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Footer Logo (BUMN, Danantara, IDSurvey) */}
          <div className="flex justify-center items-center pt-10 opacity-60 hover:opacity-100 transition-opacity">
            <Image src="/images/Logo Bawah.png" alt="BUMN" width={220} height={40} className="h-10 w-auto" />
          </div>
        </div>

      </div>
    </div>
  );
}