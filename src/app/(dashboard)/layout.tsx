import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#F8F9FA] min-h-screen">
      {/* Sidebar tetap */}
      <Sidebar />

      {/* Area Konten Utama */}
      <div className="w-full flex-1 ml-64 flex flex-col">
        <Header />
        <main className="p-10 pt-2">
          {children}
        </main>
      </div>
    </div>
  );
}