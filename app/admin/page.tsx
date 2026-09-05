import { auth } from "@/lib/auth";
import { BUCKET_QUOTA_BYTES, getTotalStorageUsage } from "@/lib/storage";
import { StorageUsage } from "@/components/admin/StorageUsage";

export default async function DashboardHome() {
  const session = await auth();
  const storage = await getTotalStorageUsage();

  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white transition-colors">Selamat Datang, {session?.user?.name}!</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg transition-colors">Ini adalah panel admin untuk mengelola website KMHDI Malang.</p>

      <StorageUsage usedBytes={storage.usedBytes} quotaBytes={BUCKET_QUOTA_BYTES} label="Kapasitas Storage (Semua Bucket)" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl shadow-lg border border-slate-200/80 dark:border-white/10 hover:shadow-[0_8px_30px_rgb(220,38,38,0.08)] dark:hover:shadow-[0_8px_30px_rgba(220,38,38,0.2)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Akses Cepat</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">Gunakan menu di samping kiri untuk menavigasi ke bagian yang Anda butuhkan.</p>
        </div>
        
        <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl shadow-lg border border-slate-200/80 dark:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Role Anda</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">Anda login sebagai:</p>
          <div className="mt-4 inline-block px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold tracking-widest text-sm shadow-md">
            {session?.user?.role}
          </div>
        </div>
      </div>
    </div>
  );
}
