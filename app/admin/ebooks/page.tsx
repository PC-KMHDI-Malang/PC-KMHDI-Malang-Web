import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { StorageUsage } from "@/components/admin/StorageUsage";
import { STORAGE_BUCKETS, BUCKET_QUOTA_BYTES, deleteFromBucketByUrl, getBucketUsage } from "@/lib/storage";
import { ImagePicker } from "@/components/ui/ImagePicker";

import { AddEbookModal } from "@/components/admin/AddEbookModal";
import { EditEbookModal } from "@/components/admin/EditEbookModal";

export default async function EbooksPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ genre?: string; sort?: string }> }) {
  const searchParams = await searchParamsPromise;
  const genreFilter = searchParams?.genre || "Semua";
  const sortFilter = searchParams?.sort || "newest";

  let query = supabaseAdmin.from("Ebook").select("*");

  if (genreFilter !== "Semua") {
    query = query.eq("genre", genreFilter);
  }

  if (sortFilter === "newest") {
    query = query.order("createdAt", { ascending: false });
  } else if (sortFilter === "oldest") {
    query = query.order("createdAt", { ascending: true });
  } else if (sortFilter === "az") {
    query = query.order("title", { ascending: true });
  } else if (sortFilter === "za") {
    query = query.order("title", { ascending: false });
  }

  const { data: ebooks, error } = await query;

  const usage = await getBucketUsage(STORAGE_BUCKETS.ebook);
  const filesUsage = await getBucketUsage(STORAGE_BUCKETS.ebookFiles);

  async function addEbook(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const pdfUrl = (formData.get("pdfUrl") as string) || null;
    const description = (formData.get("description") as string) || null;
    const genre = (formData.get("genre") as string) || "Lainnya";
    const publishYear = parseInt(formData.get("publishYear") as string, 10) || null;
    const publisher = (formData.get("publisher") as string) || "PP KMHDI";

    if (!title || !coverImageUrl || !pdfUrl) return;

    const coverImage = coverImageUrl;

    const { error } = await supabaseAdmin.from("Ebook").insert([{ title, coverImage, pdfUrl, description, genre, publishYear, publisher }]);
    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      throw new Error(error.message);
    }

    revalidatePath("/admin/ebooks");
    revalidatePath("/buku");
  }

  async function editEbook(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const pdfUrl = (formData.get("pdfUrl") as string) || null;
    const description = (formData.get("description") as string) || null;
    const genre = (formData.get("genre") as string) || "Lainnya";
    const publishYear = parseInt(formData.get("publishYear") as string, 10) || null;
    const publisher = (formData.get("publisher") as string) || "PP KMHDI";

    if (!id || !title || !coverImageUrl || !pdfUrl) return;

    const { error } = await supabaseAdmin.from("Ebook").update({ title, coverImage: coverImageUrl, pdfUrl, description, genre, publishYear, publisher }).eq("id", id);
    if (error) {
      console.error("SUPABASE UPDATE ERROR:", error);
      throw new Error(error.message);
    }

    revalidatePath("/admin/ebooks");
    revalidatePath("/buku");
  }

  async function deleteEbook(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    const { data: ebook } = await supabaseAdmin.from("Ebook").select("coverImage").eq("id", id).single();
    await supabaseAdmin.from("Ebook").delete().eq("id", id);
    if (ebook?.coverImage) await deleteFromBucketByUrl(STORAGE_BUCKETS.ebook, ebook.coverImage);
    revalidatePath("/admin/ebooks");
    revalidatePath("/buku");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Manajemen E-Book</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Kelola dan tambahkan koleksi buku saku digital KMHDI Malang.</p>
        </div>
        <AddEbookModal action={addEbook} usedBytes={usage.usedBytes} filesUsedBytes={filesUsage.usedBytes} />
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-slate-100 dark:border-white/5 gap-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
              Daftar E-Book
            </h2>
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-xs sm:text-sm font-semibold">{ebooks?.length || 0} E-Book</span>
          </div>

          <div className="w-full lg:w-auto">
            <form className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
              <select
                name="genre"
                defaultValue={genreFilter}
                className="w-full sm:w-auto bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none cursor-pointer"
              >
                <option value="Semua">Semua Jenis</option>
                <option value="Organisasi">Organisasi</option>
                <option value="Agama">Agama</option>
                <option value="Pendidikan">Pendidikan</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Sastra">Sastra</option>
                <option value="Pengembangan Diri">Pengembangan Diri</option>
                <option value="Finansial">Finansial</option>
                <option value="Lainnya">Lainnya</option>
              </select>

              <select
                name="sort"
                defaultValue={sortFilter}
                className="w-full sm:w-auto bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>

              <button type="submit" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors">
                Terapkan
              </button>
            </form>
          </div>
        </div>
        {error && <p className="text-red-500 mb-4 font-medium">Gagal mengambil data.</p>}

        <div className="space-y-6">
          {ebooks?.map((ebook) => (
            <div
              key={ebook.id}
              className="group border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row bg-white dark:bg-[#111111] hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-full md:w-56 p-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800/50">
                <div className="relative w-32 h-44 md:w-full md:h-[220px] shadow-[10px_10px_15px_rgba(0,0,0,0.2),-3px_0_5px_rgba(0,0,0,0.1)] rounded-r-xl rounded-l-sm group-hover:-translate-y-2 group-hover:shadow-[15px_15px_20px_rgba(0,0,0,0.2),-3px_0_5px_rgba(0,0,0,0.1)] transition-all duration-500">
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/40 via-white/10 to-transparent z-10 rounded-l-sm"></div>
                  <img src={ebook.coverImage} alt={ebook.title} className="w-full h-full object-cover rounded-r-xl rounded-l-sm" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-2xl text-slate-800 dark:text-white mb-2 leading-tight">{ebook.title}</h3>
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider">{ebook.genre}</span>
                </div>
                {ebook.description && <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed line-clamp-3 mb-4">{ebook.description}</p>}

                <div className="mt-auto pt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {ebook.pdfUrl ? (
                      <a
                        href={ebook.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center bg-slate-800 dark:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm text-sm gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Buka PDF
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-bold py-2 px-4 rounded-xl text-sm gap-2 cursor-not-allowed">Tidak ada file PDF</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <EditEbookModal ebook={ebook} action={editEbook} usedBytes={usage.usedBytes} filesUsedBytes={filesUsage.usedBytes} />
                    <SubmitWithConfirm
                      id={ebook.id}
                      action={deleteEbook}
                      modalTitle="Hapus E-Book?"
                      modalDesc={`Anda yakin ingin menghapus ebook "${ebook.title}"?`}
                      buttonElement={
                        <div className="flex items-center gap-2 text-red-500 dark:text-rose-400 font-bold hover:text-red-700 dark:hover:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-950/50 px-4 py-2 rounded-lg transition-colors text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          Hapus
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {ebooks?.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="w-16 h-16 mb-4 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path>
                </svg>
              </div>
              <p className="text-lg">Belum ada ebook.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
