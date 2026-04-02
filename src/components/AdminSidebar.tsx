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

export default function AdminSidebar() {
  const [isPdsOpen, setIsPdsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  const isDashboardActive = pathname === '/admin/dashboard' || pathname === '/';
  const isUsersActive = pathname?.includes('/admin/users');
  const isReportsActive = pathname?.includes('/admin/reports');
  const isSettingsActive = pathname?.includes('/admin/settings');

  const isAdminPdsActive = pathname?.includes('/admin/persetujuan') || pathname?.includes('/admin/riwayatPDS');
  const isAdminPdsList = pathname?.includes('/admin/persetujuan');
  const isAdminPdsRiwayat = pathname?.includes('/admin/riwayatPDS');

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
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

      <nav className="flex-1 px-2 space-y-2 overflow-y-auto mt-2">
        {/* dashboard */}
        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isDashboardActive
              ? 'text-white bg-[#0A8E9A] shadow-sm'
              : 'text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50'
          }`}
        >
          <Home size={20} />
          Dashboard
        </Link>

        {/* manajemen pengguna */}
        <Link
          href="/admin/users"
          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isUsersActive
              ? 'text-white bg-[#0A8E9A] shadow-sm'
              : 'text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50'
          }`}
        >
          <Users size={20} />
          Pengguna
        </Link>

        {/* menu PDS khusus admin */}
        <div>
          <button
            onClick={() => setIsPdsOpen(!isPdsOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isAdminPdsActive
                ? 'text-white bg-[#0A8E9A] shadow-sm'
                : 'text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50'
            }`}
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
                className={`flex items-center gap-3 px-2 py-2 text-sm transition-colors ${
                  isAdminPdsList
                    ? 'font-bold text-[#0A8E9A]'
                    : 'font-medium text-gray-500 hover:text-gray-800'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAdminPdsList ? 'bg-[#0A8E9A]' : 'bg-gray-400'
                  }`}
                ></div>
                Daftar PDS
              </Link>

              <Link
                href="/admin/riwayatPDS"
                className={`flex items-center gap-3 px-2 py-2 text-sm transition-colors ${
                  isAdminPdsRiwayat
                    ? 'font-bold text-[#0A8E9A]'
                    : 'font-medium text-gray-500 hover:text-gray-800'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAdminPdsRiwayat ? 'bg-[#0A8E9A]' : 'bg-gray-400'
                  }`}
                ></div>
                Riwayat PDS
              </Link>
            </div>
          )}
        </div>

        {/* laporan */}
        <Link
          href="/admin/reports"
          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isReportsActive
              ? 'text-white bg-[#0A8E9A] shadow-sm'
              : 'text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50'
          }`}
        >
          <BarChart size={20} />
          Laporan
        </Link>

        {/* pengaturan */}
        <Link
          href="/admin/settings"
          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isSettingsActive
              ? 'text-white bg-[#0A8E9A] shadow-sm'
              : 'text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50'
          }`}
        >
          <Settings size={20} />
          Pengaturan
        </Link>
      </nav>
    </aside>
  );
}