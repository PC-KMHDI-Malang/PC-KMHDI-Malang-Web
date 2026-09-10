import { requireAdmin } from "@/lib/guard";
import { errorMessage } from "@/lib/errors";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { isPasswordLongEnough, PASSWORD_RULE_TEXT } from "@/lib/password";
import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import dynamic from "next/dynamic";
import { UserTable } from "@/components/admin/UserTable";

const AddUserModal = dynamic(() => import("@/components/admin/AddUserModal").then((mod) => mod.AddUserModal));

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
    await requireAdmin();
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

      if (!isPasswordLongEnough(password)) {
        return { error: PASSWORD_RULE_TEXT };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const { error } = await supabaseAdmin.from("User").insert([{ name, email, password: hashedPassword, role, jabatan, bidang }]);

      if (error) throw error;

      revalidatePath("/admin/users");
      return { success: true, message: "Pengguna berhasil ditambahkan!" };
    } catch (err: unknown) {
      return { error: errorMessage(err, "Gagal menambahkan pengguna") };
    }
  }

  async function editUser(formData: FormData) {
    "use server";
    await requireAdmin();
    try {
      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const role = formData.get("role") as string;
      const jabatan = (formData.get("jabatan") as string) || null;
      const bidang = (formData.get("bidang") as string) || null;

      if (!id || !name || !email || !role) return { error: "Kolom wajib belum diisi" };

      const { data: target } = await supabaseAdmin.from("User").select("email, role").eq("id", id).maybeSingle();
      if (!target) return { error: "Pengguna tidak ditemukan." };

      // Menurunkan ADMIN terakhir jadi role lain sama fatalnya dengan menghapusnya: tidak ada
      // lagi akun yang bisa membuka /admin/users untuk mengembalikannya.
      if (target.role === "ADMIN" && role !== "ADMIN") {
        const { count } = await supabaseAdmin.from("User").select("id", { count: "exact", head: true }).eq("role", "ADMIN");
        if ((count ?? 0) <= 1) return { error: "Tidak bisa menurunkan role administrator terakhir." };
      }

      const updateData: Record<string, unknown> = { name, email, role, jabatan, bidang };
      if (password && isPasswordLongEnough(password)) {
        // Password akun bersama dikunci di app/actions/profile.ts — form admin ini juga harus
        // menghormatinya, kalau tidak proteksi di sana bisa dilewati lewat halaman ini.
        if (isProtectedAccountEmail(target.email)) {
          return { error: "Password akun bersama tidak bisa diganti dari sini." };
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      const { error } = await supabaseAdmin.from("User").update(updateData).eq("id", id);
      if (error) throw error;

      revalidatePath("/admin/users");
      return { success: true, message: "Pengguna berhasil diperbarui!" };
    } catch (err: unknown) {
      return { error: errorMessage(err, "Gagal memperbarui pengguna") };
    }
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const authSession = await requireAdmin();
    try {
      const id = formData.get("id") as string;
      if (!id) return { error: "ID tidak ditemukan" };

      if (id === authSession.user.id) {
        return { error: "Anda tidak bisa menghapus akun Anda sendiri." };
      }

      const { data: target } = await supabaseAdmin.from("User").select("email, role").eq("id", id).maybeSingle();
      if (!target) return { error: "Pengguna tidak ditemukan." };

      if (isProtectedAccountEmail(target.email)) {
        return { error: "Akun bersama ini tidak boleh dihapus." };
      }

      // Menghapus ADMIN terakhir akan mengunci semua orang di luar panel admin — tidak ada
      // lagi akun yang bisa membuat user baru, karena /admin/users sendiri butuh role ADMIN.
      if (target.role === "ADMIN") {
        const { count } = await supabaseAdmin.from("User").select("id", { count: "exact", head: true }).eq("role", "ADMIN");
        if ((count ?? 0) <= 1) return { error: "Tidak bisa menghapus administrator terakhir." };
      }

      const { error } = await supabaseAdmin.from("User").delete().eq("id", id);
      if (error) throw error;

      revalidatePath("/admin/users");
      return { success: true, message: "Pengguna berhasil dihapus!" };
    } catch (err: unknown) {
      return { error: errorMessage(err, "Gagal menghapus pengguna") };
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

      {error && <p className="text-red-500 mb-4 font-medium">Gagal mengambil data pengguna.</p>}

      <UserTable users={users || []} editAction={editUser} deleteAction={deleteUser} currentUserEmail={session?.user?.email || ""} />
    </div>
  );
}
