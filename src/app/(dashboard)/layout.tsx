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
    let active = true;

    async function verifySession() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();

        if (!active) return;

        if (!res.ok || !data?.success || !data?.user?.id) {
          localStorage.removeItem('user');
          setAuthorized(false);
          router.push('/login');
          return;
        }

        localStorage.setItem('user', JSON.stringify(data.user));

        if (pathname.startsWith('/admin') && data.user.role !== 'ADMIN') {
          alert("Akses Ditolak! Anda bukan Admin.");
          setAuthorized(false);
          router.push('/pds/permohonan');
          return;
        }

        setUserRole(data.user.role);
        setAuthorized(true);
      } catch {
        if (!active) return;
        localStorage.removeItem('user');
        setAuthorized(false);
        router.push('/login');
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMobileSidebarOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
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
