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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] overflow-x-hidden">
      {/* KONDISI SIDEBAR BERDASARKAN ROLE */}
      <div className="hidden lg:block">
        {userRole === 'ADMIN' ? <AdminSidebar /> : <Sidebar />}
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" aria-hidden>
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {userRole === 'ADMIN' ? <AdminSidebar /> : <Sidebar />}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <Header onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />
        
        <main className="w-full flex-1 overflow-x-hidden px-4 pt-2 pb-6 sm:px-6 lg:px-10 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}