"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, LogOut, Menu } from 'lucide-react';

type HeaderProps = {
  onToggleSidebar?: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
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
    <header className="sticky top-0 z-30 h-20 w-full border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6 lg:px-10">
      <div className="relative flex h-full w-full items-center">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 lg:hidden"
        aria-label="Buka menu sidebar"
      >
        <Menu size={18} />
      </button>

      <button
        type="button"
        className="ml-auto inline-flex shrink-0 items-center gap-3 rounded-xl p-2 transition-all hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Info Text */}
        <div className="hidden text-right sm:block">
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
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-20 right-4 z-50 w-48 animate-in zoom-in rounded-2xl border border-gray-50 bg-white py-2 shadow-xl fade-in duration-150 sm:right-6 lg:right-10">
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