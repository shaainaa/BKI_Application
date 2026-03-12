"use client";



import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, ChevronDown, ChevronUp } from 'lucide-react';

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
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
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
      <nav className="flex-1 px-2 space-y-2 overflow-y-auto mt-2">
        {/* Menu Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isDashboardActive
              ? 'text-white bg-[#0A8E9A] shadow-sm' // Warna saat aktif
              : 'text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50' // Warna saat tidak aktif
          }`}
        >
          <Home size={20} />
          Dashboard
        </Link>

        {/* Menu PDS (Dropdown) */}
        <div>
          <button
            onClick={() => setIsPdsOpen(!isPdsOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isPdsActive // Warnai toska JIKA halamannya memang PDS, BUKAN karena dropdown-nya sekadar dibuka
                ? 'text-white bg-[#0A8E9A] shadow-sm'
                : 'text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50'
            }`}
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
                className={`flex items-center gap-3 px-2 py-2 text-sm transition-colors ${
                  isPermohonanActive
                    ? 'font-bold text-[#0A8E9A]'
                    : 'font-medium text-gray-500 hover:text-gray-800'
                }`}>
                <div className={`w-2 h-2 rounded-full ${isPermohonanActive ? 'bg-[#0A8E9A]' : 'bg-gray-400'}`}></div>
                Permohonan PDS
              </Link>
              <Link
                href="/pds/riwayat"
                className={`flex items-center gap-3 px-2 py-2 text-sm transition-colors ${
                  isRiwayatActive
                    ? 'font-bold text-[#0A8E9A]'
                    : 'font-medium text-gray-500 hover:text-gray-800'
                }`}>
                <div className={`w-2 h-2 rounded-full ${isRiwayatActive ? 'bg-[#0A8E9A]' : 'bg-gray-400'}`}></div>
                Riwayat PDS
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );

}