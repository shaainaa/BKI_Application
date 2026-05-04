"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, User, LogOut, Menu } from 'lucide-react';

type HeaderProps = {
  onToggleSidebar?: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ nama: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok || !result?.success || !result?.user) {
          return;
        }

        if (isMounted) {
          setUser({
            nama: String(result.user.nama || ''),
            role: String(result.user.role || 'SURVEYOR'),
          });
        }
      } catch {
        // Ignore temporary fetch errors in header.
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleGoToProfile = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  return (
    <header className="sticky top-0 z-30 h-20 w-full px-4 sm:px-6 lg:px-10 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="relative flex h-full w-full items-center">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition hover:opacity-70 lg:hidden"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        aria-label="Buka menu sidebar"
      >
        <Menu size={18} />
      </button>

      <button
        type="button"
        className="ml-auto inline-flex shrink-0 items-center gap-3 rounded-xl p-2 transition-all"
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'transparent' }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="user-menu"
      >
        {/* Info Text */}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {user?.nama || 'Muhammad'}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
            {user?.role || 'Surveyor'}
          </p>
        </div>

        {/* Profile Image */}
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border" style={{ borderColor: 'var(--color-border)' }}>
          <Image
            src="/images/BKI.png"
            alt="Profil pengguna"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>

        <ChevronDown size={16} className="transition-transform" style={{ color: 'var(--color-text-secondary)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div id="user-menu" role="menu" aria-label="Menu pengguna" className="absolute top-20 right-4 z-50 w-48 animate-in zoom-in rounded-2xl border fade-in duration-150 sm:right-6 lg:right-10" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          <button
            type="button"
            role="menuitem"
            onClick={handleGoToProfile}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-light)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <User size={16} /> Profil Saya
          </button>
          <div style={{ borderColor: 'var(--color-border)' }} className="border-t my-1"></div>
          <button 
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
            style={{ color: 'var(--color-danger)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
      </div>
    </header>
  );
}