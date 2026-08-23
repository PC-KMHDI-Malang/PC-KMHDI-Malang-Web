import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";

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

    revalidatePath("/admin/ebooks");
  }

  // Server Action: Delete Ebook
  async function deleteEbook(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    await supabaseAdmin.from("Ebook").delete().eq("id", id);
    revalidatePath("/admin/ebooks");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Manajemen E-Book</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Kelola dan tambahkan koleksi buku saku digital KMHDI Malang.</p>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 mb-10 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-red-600 dark:bg-rose-500 rounded-full inline-block"></span>
          Tambah E-Book Baru
        </h2>
        <form action={addEbook} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Ebook</label>
            <input type="text" name="title" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" placeholder="Masukkan judul..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">URL Gambar Sampul (Cover)</label>
            <input type="url" name="coverImage" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Link Google Drive</label>
            <input type="url" name="driveLink" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" placeholder="https://drive.google.com/..." />
          </div>
          <div className="pt-2">
            <button type="submit" className="bg-red-600 dark:bg-rose-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-red-600/30 dark:hover:shadow-rose-900/30 transition-all duration-300">
              Simpan E-Book
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 transition-colors">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
            Daftar E-Book
          </h2>
          <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-sm font-semibold">{ebooks?.length || 0} Tersedia</span>
        </div>
        {error && <p className="text-red-500 mb-4 font-medium">Gagal mengambil data.</p>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {ebooks?.map((ebook) => (
            <div key={ebook.id} className="group relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300">
              <div className="relative h-64 overflow-hidden bg-slate-200 dark:bg-slate-800">
                <img src={ebook.coverImage} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
              </div>
              <div className="absolute top-3 right-3">
                <SubmitWithConfirm
                  id={ebook.id}
                  action={deleteEbook}
                  modalTitle="Hapus E-Book?"
                  modalDesc={`Anda yakin ingin menghapus ebook "${ebook.title}"?`}
                  buttonElement={
                    <div className="w-8 h-8 flex items-center justify-center bg-red-600/90 dark:bg-rose-600/90 text-white rounded-full hover:bg-red-700 dark:hover:bg-rose-700 hover:scale-110 transition-transform shadow-lg" title="Hapus E-Book">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </div>
                  }
                />
              </div>
              <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                <h3 className="font-bold text-lg leading-tight mb-4 drop-shadow-md line-clamp-2">{ebook.title}</h3>
                <a 
                  href={ebook.driveLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block w-full text-center bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold py-2 rounded-xl hover:bg-white hover:text-slate-900 transition-all duration-300 text-sm"
                >
                  Buka Drive
                </a>
              </div>
            </div>
          ))}
          {ebooks?.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
               <div className="w-16 h-16 mb-4 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
              </div>
              <p className="text-lg">Belum ada ebook.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
