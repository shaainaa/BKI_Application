"use client";



import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { getSidebarItemClassName, sidebarNavClassName, getSidebarSubDotClassName, getSidebarSubItemClassName, sidebarShellClassName } from '@/components/sidebarStyles';

export default function Sidebar() {
  const [isPdsOpen, setIsPdsOpen] = useState<boolean>(true);
  // Mengambil informasi URL saat ini
  const pathname = usePathname();
  // --- LOGIKA PENGECEKAN HALAMAN AKTIF ---
  // Cek apakah URL adalah /dashboard atau halaman utama (/)
  const isDashboardActive = pathname === '/dashboard' || pathname === '/';
  // Cek apakah URL mengandung permohonan atau riwayat
  const isPermohonanActive = pathname?.includes('permohonan');
  const isRiwayatActive = pathname?.includes('riwayat');
  // Menu PDS Utama dianggap aktif JIKA salah satu sub-menunya aktif
  const isPdsActive = isPermohonanActive || isRiwayatActive;

  return (
    <aside className={sidebarShellClassName}>
      {/* --- Bagian Logo --- */}
      <div className="p-4 flex items-center gap-2">
        <Image
          src="/images/Logo Dashboard.png"
          alt="Logo ID Survey"
          width={120}
          height={40}
          className="h-15 w-auto object-contain"
          priority
        />
      </div>
      {/* --- Bagian Menu Navigasi --- */}
      <nav className={sidebarNavClassName}>
        {/* Menu Dashboard */}
        <Link
          href="/dashboard"
          className={getSidebarItemClassName(isDashboardActive)}
        >
          <Home size={20} />
          Dashboard
        </Link>

        {/* Menu PDS (Dropdown) */}
        <div>
          <button
            onClick={() => setIsPdsOpen(!isPdsOpen)}
            className={getSidebarItemClassName(isPdsActive) + ' w-full justify-between'}
          >
            <div className="flex items-center gap-3">
              <FileText size={20} />
              PDS
            </div>
            {isPdsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Sub-menu PDS (Permohonan & Riwayat) */}
          {isPdsOpen && (
            <div className="ml-8 mt-2 space-y-1">
              <Link
                href="/pds/permohonan"
                className={getSidebarSubItemClassName(isPermohonanActive)}>
                <div className={getSidebarSubDotClassName(isPermohonanActive)}></div>
                Permohonan PDS
              </Link>
              <Link
                href="/pds/riwayat"
                className={getSidebarSubItemClassName(isRiwayatActive)}>
                <div className={getSidebarSubDotClassName(isRiwayatActive)}></div>
                Riwayat PDS
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );

}