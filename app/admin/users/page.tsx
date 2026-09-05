import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AddUserModal } from "@/components/admin/AddUserModal";
import { UserTable } from "@/components/admin/UserTable";

export default async function UsersPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-rose-500">Akses Ditolak</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  const { data: users, error } = await supabaseAdmin.from("User").select("id, name, email, role, jabatan, bidang, createdAt").order("createdAt", { ascending: false });

  async function addUser(formData: FormData) {
    "use server";
    try {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const role = formData.get("role") as string;
      const jabatan = (formData.get("jabatan") as string) || null;
      const bidang = (formData.get("bidang") as string) || null;

      if (!name || !email || !password || !role) {
        return { error: "Semua kolom wajib diisi" };
      }

      if (password.trim().length < 6) {
        return { error: "Password minimal 6 karakter" };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const { error } = await supabaseAdmin.from("User").insert([{ name, email, password: hashedPassword, role, jabatan, bidang }]);

      if (error) throw error;

      revalidatePath("/admin/users");
      return { success: true, message: "Pengguna berhasil ditambahkan!" };
    } catch (err: any) {
      return { error: err.message || "Gagal menambahkan pengguna" };
    }
  }

  async function editUser(formData: FormData) {
    "use server";
    try {
      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const role = formData.get("role") as string;
      const jabatan = (formData.get("jabatan") as string) || null;
      const bidang = (formData.get("bidang") as string) || null;

      if (!id || !name || !email || !role) return { error: "Kolom wajib belum diisi" };

      const updateData: any = { name, email, role, jabatan, bidang };
      if (password && password.trim().length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const { error } = await supabaseAdmin.from("User").update(updateData).eq("id", id);
      if (error) throw error;

      revalidatePath("/admin/users");
      return { success: true, message: "Pengguna berhasil diperbarui!" };
    } catch (err: any) {
      return { error: err.message || "Gagal memperbarui pengguna" };
    }
  }

  async function deleteUser(formData: FormData) {
    "use server";
    try {
      const id = formData.get("id") as string;
      if (!id) return { error: "ID tidak ditemukan" };

      const { error } = await supabaseAdmin.from("User").delete().eq("id", id);
      if (error) throw error;

      revalidatePath("/admin/users");
      return { success: true, message: "Pengguna berhasil dihapus!" };
    } catch (err: any) {
      return { error: err.message || "Gagal menghapus pengguna" };
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Manajemen User</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Kelola akun administrator dan anggota (user) sistem.</p>
        </div>
        <AddUserModal action={addUser} />
      </div>

      <UserTable users={users || []} editAction={editUser} deleteAction={deleteUser} currentUserEmail={session?.user?.email || ""} />
    </div>
  );
}
