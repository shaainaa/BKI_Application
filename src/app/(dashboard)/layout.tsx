"use client";

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
      router.push('/login');
    } else if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      // Jika Surveyor coba masuk ke folder /admin, lempar balik
      alert("Akses Ditolak! Anda bukan Admin.");
      router.push('/pds/permohonan');
    } else {
      setAuthorized(true);
    }
  }, [pathname]);

  if (!authorized) return null; // Cegah "flicker" konten sebelum redirect

  return (
    // Tambahkan overflow-hidden di bungkus paling luar untuk mematikan scroll layar utama
    <div className="flex bg-[#F8F9FA] min-h-screen overflow-hidden">
      {/* Sidebar tetap */}
      <Sidebar />

      {/* Area Konten Utama */}
      {/* Hapus w-full. Cukup pakai flex-1 untuk mengisi sisa layar. Tambahkan min-w-0 agar tidak tertendang oleh tabel yang panjang */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header />
        
        {/* Hapus flex (agar tidak merusak dimensi child) dan tambahkan overflow-x-hidden */}
        <main className="p-10 pt-2 flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}