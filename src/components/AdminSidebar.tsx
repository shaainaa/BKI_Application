"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  FileText,
  BarChart,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getSidebarItemClassName, getSidebarSubDotClassName, getSidebarSubItemClassName, sidebarNavClassName, sidebarShellClassName } from '@/components/sidebarStyles';

export default function AdminSidebar() {
  const [isPdsOpen, setIsPdsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  const isDashboardActive = pathname === '/admin/dashboard' || pathname === '/';
  const isUsersActive = pathname?.includes('/admin/pengguna');
  const isReportsActive = pathname?.includes('/admin/reports');
  const isSettingsActive = pathname?.includes('/admin/settings');

  const isAdminPdsActive = pathname?.includes('/admin/persetujuan') || pathname?.includes('/admin/riwayatPDS');
  const isAdminPdsList = pathname?.includes('/admin/persetujuan');
  const isAdminPdsRiwayat = pathname?.includes('/admin/riwayatPDS');

  return (
    <aside className={sidebarShellClassName}>
      {/* logo */}
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

      <nav className={sidebarNavClassName}>
        {/* dashboard */}
        <Link
          href="/admin/dashboard"
          className={getSidebarItemClassName(isDashboardActive)}
        >
          <Home size={20} />
          Dashboard
        </Link>

        {/* manajemen pengguna */}
        <Link
          href="/admin/pengguna"
          className={getSidebarItemClassName(isUsersActive)}
        >
          <Users size={20} />
          Pengguna
        </Link>

        {/* menu PDS khusus admin */}
        <div>
          <button
            onClick={() => setIsPdsOpen(!isPdsOpen)}
            className={getSidebarItemClassName(isAdminPdsActive) + ' w-full justify-between'}
          >
            <div className="flex items-center gap-3">
              <FileText size={20} />
              PDS Admin
            </div>
            {isPdsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isPdsOpen && (
            <div className="ml-8 mt-2 space-y-1">
              <Link
                href="/admin/persetujuan"
                className={getSidebarSubItemClassName(isAdminPdsList)}
              >
                <div className={getSidebarSubDotClassName(isAdminPdsList)}></div>
                Daftar PDS
              </Link>

              <Link
                href="/admin/riwayatPDS"
                className={getSidebarSubItemClassName(isAdminPdsRiwayat)}
              >
                <div className={getSidebarSubDotClassName(isAdminPdsRiwayat)}></div>
                Riwayat PDS
              </Link>
            </div>
          )}
        </div>

        {/* laporan */}
        <Link
          href="/admin/reports"
          className={getSidebarItemClassName(isReportsActive)}
        >
          <BarChart size={20} />
          Laporan
        </Link>

        {/* pengaturan */}
        <Link
          href="/admin/settings"
          className={getSidebarItemClassName(isSettingsActive)}
        >
          <Settings size={20} />
          Pengaturan
        </Link>
      </nav>
    </aside>
  );
}