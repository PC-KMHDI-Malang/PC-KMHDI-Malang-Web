import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export default async function EbooksPage() {
  // Fetch ebooks
  const { data: ebooks, error } = await supabaseAdmin
    .from("Ebook")
    .select("*")
    .order("createdAt", { ascending: false });

  // Server Action: Add Ebook
  async function addEbook(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const coverImage = formData.get("coverImage") as string;
    const driveLink = formData.get("driveLink") as string;

    if (!title || !coverImage || !driveLink) return;

    await supabaseAdmin.from("Ebook").insert([
      { title, coverImage, driveLink }
    ]);

    revalidatePath("/dashboard/ebooks");
  }

  // Server Action: Delete Ebook
  async function deleteEbook(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    await supabaseAdmin.from("Ebook").delete().eq("id", id);
    revalidatePath("/dashboard/ebooks");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manajemen Ebook</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border">
        <h2 className="text-lg font-semibold mb-4">Tambah Ebook Baru</h2>
        <form action={addEbook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Judul Ebook</label>
            <input type="text" name="title" required className="w-full border rounded-md p-2" placeholder="Masukkan judul..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL Gambar Sampul (Cover)</label>
            <input type="url" name="coverImage" required className="w-full border rounded-md p-2" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link Google Drive</label>
            <input type="url" name="driveLink" required className="w-full border rounded-md p-2" placeholder="https://drive.google.com/..." />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            Simpan Ebook
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Daftar Ebook ({ebooks?.length || 0})</h2>
        {error && <p className="text-red-500">Gagal mengambil data.</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ebooks?.map((ebook) => (
            <div key={ebook.id} className="border rounded-lg overflow-hidden flex flex-col">
              <img src={ebook.coverImage} alt={ebook.title} className="w-full h-48 object-cover bg-gray-100" />
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg mb-2">{ebook.title}</h3>
                <a href={ebook.driveLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mb-4 text-sm break-all">
                  Buka Link Drive
                </a>
                <div className="mt-auto">
                  <form action={deleteEbook}>
                    <input type="hidden" name="id" value={ebook.id} />
                    <button type="submit" className="text-red-600 text-sm font-medium hover:underline">
                      Hapus
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {ebooks?.length === 0 && <p className="text-gray-500 col-span-full">Belum ada ebook.</p>}
        </div>
      </div>
    </div>
  );
}
