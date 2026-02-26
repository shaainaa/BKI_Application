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
    <div className="flex bg-[#F8F9FA] min-h-screen">
      {/* Sidebar tetap */}
      <Sidebar />

      {/* Area Konten Utama */}
      <div className="w-full flex-1 ml-64 flex flex-col">
        <Header />
        <main className="flex p-10 pt-2">
          {children}
        </main>
      </div>
    </div>
  );
}