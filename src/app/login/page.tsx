"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

      const data = await res.json();

      if (data.success) {
        // Simpan data user ke localStorage untuk sesi sederhana
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'ADMIN') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/pds/permohonan';
        } 
      } else {
        setError(data.message || 'Username atau password salah');
      }
    } catch (err) {
      setError("Gagal terhubung ke server. Pastikan database menyala.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 font-sans">
      {/* Container Utama */}
      <div className="flex w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl min-h-[600px]">
        
        {/* Kolom Kiri: Gambar Background (Hidden di Mobile) */}
        <div className="hidden md:block md:w-1/2 relative">
          <img 
            src="/images/Foto Login.png" 
            alt="Surveyor BKI" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay gradasi agar gambar lebih menyatu dengan desain */}
          <div className="absolute inset-0 bg-blue-900/10"></div>
        </div>

        {/* Kolom Kanan: Form Login */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between">
          <div>
            {/* Logo Section */}
            <div className="flex justify-center items-center md:justify-center mb-10">
              <img src="/images/BKI.png" alt="Logo BKI" className="h-20 w-auto object-contain" />
            </div>

            {/* Header Text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
              <p className="text-gray-400 text-sm">Silakan masukkan akun Anda untuk melanjutkan</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-xs mb-6 rounded shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] ml-1">Username</label>
                <input 
                  type="text" 
                  placeholder="Username"
                  className="w-full border-none bg-gray-100 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black text-sm transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter password"
                    className="w-full border-none bg-gray-100 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black text-sm transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  {/* Toggle Password Visibility */}
                  <button 
                    type="button" 
                    className="absolute right-4 top-4 text-gray-400 hover:text-blue-600 transition-colors"
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
                <div className="text-right mt-1">
                  <a href="#" className="text-[11px] text-blue-600 hover:underline font-medium">Forgot password?</a>
                </div>
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-[0.98] flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
            <img src="/images/Logo Bawah.png" alt="BUMN" className="h-10 w-auto" />
          </div>
        </div>

      </div>
    </div>
  );
}