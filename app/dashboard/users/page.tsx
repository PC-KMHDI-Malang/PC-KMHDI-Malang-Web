import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export default async function UsersPage() {
  const session = await auth();
  
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="mt-2 text-gray-700">Halaman ini hanya dapat diakses oleh Administrator.</p>
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

    revalidatePath("/dashboard/users");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    await supabaseAdmin.from("User").delete().eq("id", id);
    revalidatePath("/dashboard/users");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manajemen User</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border">
        <h2 className="text-lg font-semibold mb-4">Tambah Akun Baru</h2>
        <form action={addUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
              <input type="text" name="name" required className="w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" name="email" required className="w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" name="password" required className="w-full border rounded-md p-2" minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role (Hak Akses)</label>
              <select name="role" className="w-full border rounded-md p-2 bg-white">
                <option value="USER">User Biasa</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            Daftarkan Akun
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Daftar Akun ({users?.length || 0})</h2>
        {error && <p className="text-red-500">Gagal mengambil data.</p>}
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 font-semibold text-gray-700">Nama</th>
              <th className="p-3 font-semibold text-gray-700">Email</th>
              <th className="p-3 font-semibold text-gray-700">Role</th>
              <th className="p-3 font-semibold text-gray-700">Tanggal Daftar</th>
              <th className="p-3 font-semibold text-gray-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("id-ID")}
                </td>
                <td className="p-3 text-right">
                  {/* Jangan izinkan admin menghapus dirinya sendiri */}
                  {session?.user?.email !== u.email && (
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="text-red-600 text-sm font-medium hover:underline">
                        Hapus
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
