import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export default async function GalleryPage() {
  const { data: galleries, error } = await supabaseAdmin
    .from("Gallery")
    .select("*")
    .order("createdAt", { ascending: false });

  async function addGallery(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const coverImage = formData.get("coverImage") as string;
    const description = formData.get("description") as string;

    // Supabase slug is required based on schema. We can just generate a random slug or use title.
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

    if (!title || !coverImage) return;

    await supabaseAdmin.from("Gallery").insert([
      { title, coverImage, description, slug }
    ]);

    revalidatePath("/dashboard/gallery");
  }

  async function deleteGallery(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    await supabaseAdmin.from("Gallery").delete().eq("id", id);
    revalidatePath("/dashboard/gallery");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manajemen Galeri</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border">
        <h2 className="text-lg font-semibold mb-4">Tambah Foto Galeri</h2>
        <form action={addGallery} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Judul Foto</label>
            <input type="text" name="title" required className="w-full border rounded-md p-2" placeholder="Masukkan judul..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL Foto</label>
            <input type="url" name="coverImage" required className="w-full border rounded-md p-2" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi Singkat (Opsional)</label>
            <textarea name="description" className="w-full border rounded-md p-2" rows={3}></textarea>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            Simpan Foto
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Daftar Foto ({galleries?.length || 0})</h2>
        {error && <p className="text-red-500">Gagal mengambil data.</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries?.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col">
              <img src={item.coverImage} alt={item.title} className="w-full h-48 object-cover bg-gray-100" />
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                {item.description && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>}
                
                <div className="mt-auto pt-4">
                  <form action={deleteGallery}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="text-red-600 text-sm font-medium hover:underline">
                      Hapus
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {galleries?.length === 0 && <p className="text-gray-500 col-span-full">Belum ada foto di galeri.</p>}
        </div>
      </div>
    </div>
  );
}
