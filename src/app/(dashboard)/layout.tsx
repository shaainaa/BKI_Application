"use client";

import Sidebar from '@/components/Sidebar'; // Ini Sidebar Surveyor
import AdminSidebar from '@/components/AdminSidebar'; // Import Sidebar Admin kamu
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const user = JSON.parse(userRaw || '{}');
    
    if (!user.id) {
      router.push('/login');
    } else if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      alert("Akses Ditolak! Anda bukan Admin.");
      router.push('/pds/permohonan');
    } else {
      setUserRole(user.role); // Simpan role ke state
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized) return null;

  return (
    <div className="flex bg-[#F8F9FA] min-h-screen overflow-hidden">
      {/* KONDISI SIDEBAR BERDASARKAN ROLE */}
      {userRole === 'ADMIN' ? <AdminSidebar /> : <Sidebar />}

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header />
        
        <main className="p-10 pt-2 flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}