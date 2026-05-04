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
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok || !result?.success || !result?.user) {
          router.push('/login');
          return;
        }

        const role = String(result.user.role || 'SURVEYOR');

        if (pathname.startsWith('/admin') && role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }

        if (isMounted) {
          setUserRole(role);
          setAuthorized(true);
        }
      } catch {
        router.push('/login');
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-light)] overflow-x-hidden">
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
        
        <main id="main-content" className="w-full flex-1 overflow-x-hidden px-4 pt-2 pb-6 sm:px-6 lg:px-10 lg:pb-10" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}