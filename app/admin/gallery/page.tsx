import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { STORAGE_BUCKETS, deleteFromBucketByUrl } from "@/lib/storage";
import { AddGalleryModal } from "@/components/admin/AddGalleryModal";
import { EditGalleryModal } from "@/components/admin/EditGalleryModal";

export default async function GalleryPage() {
  const { data: gallery, error } = await supabaseAdmin.from("Gallery").select("*").order("createdAt", { ascending: false });

  async function addGallery(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const description = formData.get("description") as string;
    const createdAt = formData.get("createdAt") as string;

    if (!title || !coverImageUrl) throw new Error("Judul dan gambar foto wajib diisi.");

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const coverImage = coverImageUrl;

    const payload: any = { title, coverImage, description, slug };
    if (createdAt) {
      payload.createdAt = new Date(createdAt).toISOString();
    }

    const { error: insertError } = await supabaseAdmin.from("Gallery").insert([payload]);
    if (insertError) throw new Error("Gagal menambah foto: " + insertError.message);

    revalidatePath("/admin/gallery");
    revalidatePath("/");
  }

  async function editGallery(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const description = formData.get("description") as string;
    const createdAt = formData.get("createdAt") as string;

    if (!id || !title || !coverImageUrl) throw new Error("Judul dan gambar foto wajib diisi.");

    const payload: any = { title, coverImage: coverImageUrl, description };
    if (createdAt) {
      payload.createdAt = new Date(createdAt).toISOString();
    }

    const { error: updateError } = await supabaseAdmin.from("Gallery").update(payload).eq("id", id);
    if (updateError) throw new Error("Gagal menyimpan perubahan foto: " + updateError.message);

    revalidatePath("/admin/gallery");
    revalidatePath("/");
  }

  async function deleteGallery(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    const { data: gal } = await supabaseAdmin.from("Gallery").select("coverImage").eq("id", id).maybeSingle();
    await supabaseAdmin.from("Gallery").delete().eq("id", id);
    if (gal?.coverImage) await deleteFromBucketByUrl(STORAGE_BUCKETS.gallery, gal.coverImage);
    revalidatePath("/admin/gallery");
    revalidatePath("/");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Manajemen Galeri</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Kelola foto-foto dokumentasi kegiatan KMHDI Malang.</p>
        </div>
        <AddGalleryModal action={addGallery} />
      </div>

      <div className="bg-white dark:bg-[#111114] p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
            Daftar Foto
          </h2>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-xs sm:text-sm font-semibold">{gallery?.length || 0} Tersedia</span>
        </div>
        {error && <p className="text-red-500 mb-4 font-medium">Gagal mengambil data.</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {gallery?.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#111114] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl dark:hover:shadow-black/50 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-200 dark:bg-white/5">
                <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
              </div>

              <div className="absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center">
                <EditGalleryModal item={item} action={editGallery} />
                <SubmitWithConfirm
                  id={item.id}
                  action={deleteGallery}
                  modalTitle="Hapus Foto Galeri?"
                  modalDesc={`Anda yakin ingin menghapus foto "${item.title}" dari galeri?`}
                  buttonElement={
                    <div
                      className="w-10 h-10 flex items-center justify-center bg-red-600/90 dark:bg-rose-600/90 text-white rounded-full hover:bg-red-700 dark:hover:bg-rose-700 hover:scale-110 transition-transform shadow-xl backdrop-blur-sm"
                      title="Hapus Foto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </div>
                  }
                />
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="font-bold text-xl leading-tight mb-2 drop-shadow-lg">{item.title}</h3>
                {item.description && <p className="text-slate-200 text-sm line-clamp-2 drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{item.description}</p>}
              </div>
            </div>
          ))}
          {gallery?.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="w-16 h-16 mb-4 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <p className="text-lg">Belum ada foto di galeri.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
