import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { EditUserModal } from "@/components/admin/EditUserModal";

export default async function UsersPage() {
  const session = await auth();
  
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-rose-500">Akses Ditolak</h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  const { data: users, error } = await supabaseAdmin
    .from("User")
    .select("id, name, email, role, createdAt")
    .order("createdAt", { ascending: false });

  async function addUser(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!name || !email || !password || !role) return;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    await supabaseAdmin.from("User").insert([
      { name, email, password: hashedPassword, role }
    ]);

    revalidatePath("/admin/users");
  }

  async function editUser(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!id || !name || !email || !role) return;

    const updateData: any = { name, email, role };
    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await supabaseAdmin.from("User").update(updateData).eq("id", id);
    revalidatePath("/admin/users");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    await supabaseAdmin.from("User").delete().eq("id", id);
    revalidatePath("/admin/users");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Manajemen User</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Kelola akun administrator dan anggota (user) sistem.</p>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 mb-10 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-red-600 dark:bg-rose-500 rounded-full inline-block"></span>
          Daftarkan Akun Baru
        </h2>
        <form action={addUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
              <input type="text" name="name" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input type="email" name="email" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <input type="password" name="password" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" minLength={6} placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Role (Hak Akses)</label>
              <select name="role" className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all text-slate-700 font-medium cursor-pointer">
                <option value="USER">User Biasa</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="bg-red-600 dark:bg-rose-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-red-600/30 dark:hover:shadow-rose-900/30 transition-all duration-300">
              Daftarkan Akun
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 transition-colors">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
            Daftar Akun
          </h2>
          <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-sm font-semibold">{users?.length || 0} Terdaftar</span>
        </div>
        {error && <p className="text-red-500 mb-4 font-medium">Gagal mengambil data.</p>}
        
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none border border-slate-100 dark:border-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Nama</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Email</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Role</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Tanggal Daftar</th>
                  <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u) => (
                  <tr key={u.id} className="group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="px-6 py-5 text-sm font-bold text-slate-800 dark:text-white">{u.name}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 text-xs rounded-full font-bold tracking-wider uppercase shadow-sm ${
                        u.role === 'ADMIN' ? 'bg-red-600 dark:bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400 dark:text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <EditUserModal user={{
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          role: u.role
                        }} action={editUser} />
                        
                        {session?.user?.email !== u.email ? (
                          <SubmitWithConfirm
                            id={u.id}
                            action={deleteUser}
                            modalTitle="Hapus User?"
                            modalDesc={`Anda yakin ingin menghapus akun ${u.name} (${u.email})?`}
                            buttonElement={
                              <div className="text-red-500 dark:text-rose-400 font-bold hover:text-red-700 dark:hover:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Hapus
                              </div>
                            }
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-sm font-medium italic px-3 py-1.5">Akun Anda</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
