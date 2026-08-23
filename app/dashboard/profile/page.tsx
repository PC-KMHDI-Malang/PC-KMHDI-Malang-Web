import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <p>Silakan login terlebih dahulu.</p>;
  }

  async function updatePassword(formData: FormData) {
    "use server";
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    
    if (!currentPassword || !newPassword || newPassword.length < 6) return;

    // Ambil data user saat ini dari database
    const { data: user } = await supabaseAdmin
      .from("User")
      .select("password")
      .eq("id", session!.user!.id)
      .single();

    if (!user) return; // User tidak ditemukan

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      // Dalam implementasi nyata, tampilkan error yang tepat ke client (misal pakai useActionState)
      console.error("Password lama salah");
      return; 
    }

    // Hash password baru dan simpan
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    await supabaseAdmin
      .from("User")
      .update({ password: hashedNewPassword })
      .eq("id", session!.user!.id);

    console.log("Password berhasil diubah!");
    revalidatePath("/dashboard/profile");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Profil & Pengaturan</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-2">Informasi Akun</h2>
        <div className="mb-6 space-y-1 text-gray-700">
          <p><strong>Nama:</strong> {session.user.name}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Role:</strong> {session.user.role}</p>
        </div>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-lg font-semibold mb-4">Ganti Password</h2>
        <form action={updatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Password Saat Ini</label>
            <input 
              type="password" 
              name="currentPassword" 
              required 
              className="w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password Baru (Min. 6 Karakter)</label>
            <input 
              type="password" 
              name="newPassword" 
              required 
              minLength={6}
              className="w-full border rounded-md p-2" 
            />
          </div>
          <button type="submit" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
            Perbarui Password
          </button>
        </form>
      </div>
    </div>
  );
}
