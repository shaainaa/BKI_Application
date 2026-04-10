"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, LogOut } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useState<{ nama: string; role: string } | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleGoToProfile = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-40 h-20 border-b border-gray-100 bg-white px-10 shadow-sm">
      <div className="relative flex h-full items-center justify-end">
      <div 
        className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Info Text */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-800 leading-tight">
            {user?.nama || 'Muhammad'}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {user?.role || 'Surveyor'}
          </p>
        </div>

        {/* Profile Image */}
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-white">
          <img 
            src="/next.svg" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>

        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-50 py-2 z-50 animate-in fade-in zoom-in duration-150">
          <button
            onClick={handleGoToProfile}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <User size={16} /> Profil Saya
          </button>
          <div className="border-t border-gray-50 my-1"></div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
      </div>
    </header>
  );
}