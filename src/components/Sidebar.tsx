"use client";

import React, { useState } from 'react';
import Image from 'next/image'; // Import komponen Image dari Next.js
import { Home, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function Sidebar() {
  const [isPdsOpen, setIsPdsOpen] = useState<boolean>(true);

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
      {/* --- Bagian Logo --- */}
      <div className="p-4 flex items-center gap-2">
        {/* Logo ID Survey */}
        <Image 
          src="/images/Logo Dashboard.png" 
          alt="Logo ID Survey" 
          width={120} 
          height={40} 
          className="h-15 w-auto object-contain" // Tinggi di-set tetap (h-8), lebar menyesuaikan otomatis
          priority // Prioritaskan loading logo saat halaman pertama dibuka
        />
      </div>

      {/* --- Bagian Menu Navigasi --- */}
      <nav className="flex-1 px-2  space-y-2 overflow-y-auto mt-2">
        
        {/* Menu Dashboard */}
        <a 
          href="/dashboard" 
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#0A8E9A] hover:bg-teal-50 rounded-lg transition-colors"
        >
          <Home size={20} />
          Dashboard
        </a>

        {/* Menu PDS (Dropdown) */}
        <div>
          <button 
            onClick={() => setIsPdsOpen(!isPdsOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isPdsOpen 
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
              <a 
                href="/pds/permohonan" 
                className="flex items-center gap-3 px-2 py-2 text-sm font-bold text-[#0A8E9A]"
              >
                <div className="w-2 h-2 rounded-full bg-[#0A8E9A]"></div>
                Permohonan PDS
              </a>
              
              <a 
                href="/riwayat-pds" 
                className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                Riwayat PDS
              </a>
            </div>
          )}
        </div>

      </nav>
    </aside>
  );
}