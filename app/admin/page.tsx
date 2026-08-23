import { auth } from "@/lib/auth";

export default async function DashboardHome() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-slate-900">Selamat Datang, {session?.user?.name}!</h1>
      <p className="text-slate-500 mb-10 text-lg">Ini adalah panel admin untuk mengelola website KMHDI Malang.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(220,38,38,0.08)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h2 className="text-xl font-bold text-slate-800">Akses Cepat</h2>
          <p className="text-slate-500 mt-3 leading-relaxed">Gunakan menu di samping kiri untuk menavigasi ke bagian yang Anda butuhkan.</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h2 className="text-xl font-bold text-slate-800">Role Anda</h2>
          <p className="text-slate-500 mt-3 leading-relaxed">Anda login sebagai:</p>
          <div className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl font-bold tracking-widest text-sm shadow-md">
            {session?.user?.role}
          </div>
        </div>
      </div>
    </div>
  );
}
