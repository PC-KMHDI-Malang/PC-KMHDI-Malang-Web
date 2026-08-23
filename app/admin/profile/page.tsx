import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UpdatePasswordForm } from "@/components/admin/UpdatePasswordForm";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <p>Silakan login terlebih dahulu.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Profil & Pengaturan</h1>
        <p className="text-slate-500 text-lg">Kelola informasi akun dan kata sandi Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-slate-900 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-xl shadow-slate-900/20">
              {session.user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{session.user.name}</h2>
            <p className="text-slate-500 font-medium mb-4">{session.user.email}</p>
            <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-bold tracking-widest uppercase">
              {session.user.role}
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-slate-800 rounded-full inline-block"></span>
              Ganti Password
            </h2>
            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
