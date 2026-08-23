import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";

export default async function NewsAdminPage() {
  const session = await auth();

  const { data: news, error } = await supabaseAdmin
    .from("News")
    .select("*, Category(name)")
    .order("createdAt", { ascending: false });

  async function addNews(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const coverImage = formData.get("coverImage") as string;

    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") + "-" + Date.now();

    // Pastikan kategori umum ada
    let { data: cat } = await supabaseAdmin.from("Category").select("id").eq("slug", "umum").single();
    if (!cat) {
      const { data: newCat } = await supabaseAdmin.from("Category").insert([{ name: "Umum", slug: "umum" }]).select().single();
      cat = newCat;
    }

    const authSession = await auth();
    if (!authSession?.user?.id) throw new Error("Unauthorized");

    await supabaseAdmin.from("News").insert([
      { 
        title, 
        slug, 
        excerpt, 
        content, 
        coverImage, 
        status: "PUBLISHED", 
        authorId: authSession.user.id,
        categoryId: cat!.id
      }
    ]);
    revalidatePath("/admin/news");
    revalidatePath("/");
  }

  async function deleteNews(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await supabaseAdmin.from("News").delete().eq("id", id);
    revalidatePath("/admin/news");
    revalidatePath("/");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Manajemen Artikel</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Tulis dan publikasikan berita terbaru untuk KMHDI Malang.</p>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 mb-10 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-red-600 dark:bg-rose-500 rounded-full inline-block"></span>
          Tulis Artikel Baru
        </h2>
        <form action={addNews} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Artikel</label>
            <input type="text" name="title" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all text-lg font-semibold" placeholder="Masukkan judul menarik..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ringkasan (Excerpt)</label>
            <textarea name="excerpt" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" rows={2} placeholder="Satu atau dua kalimat untuk menarik minat pembaca..."></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Isi Artikel Lengkap</label>
            <textarea name="content" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-4 outline-none transition-all leading-relaxed" rows={8} placeholder="Ketik isi lengkap artikel Anda di sini..."></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">URL Gambar Cover</label>
            <input type="url" name="coverImage" required className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all" placeholder="https://..." />
          </div>
          <div className="pt-2">
            <button type="submit" className="bg-red-600 dark:bg-rose-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-red-600/30 dark:hover:shadow-rose-900/30 transition-all duration-300">
              Publikasikan Artikel
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 transition-colors">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
            Daftar Artikel
          </h2>
          <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-sm font-semibold">{news?.length || 0} Diterbitkan</span>
        </div>
        {error && <p className="text-red-500 mb-4 font-medium">Gagal mengambil data.</p>}
        
        <div className="space-y-6">
          {news?.map((n) => (
            <div key={n.id} className="group border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row bg-white dark:bg-[#111111] hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300">
              <div className="w-full md:w-64 h-48 md:h-auto relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={n.coverImage} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-red-50 dark:bg-rose-950/30 text-red-600 dark:text-rose-400 rounded-full text-xs font-bold tracking-wider uppercase border border-red-100 dark:border-rose-900/30">
                    {n.Category?.name || 'UMUM'}
                  </span>
                </div>
                <h3 className="font-bold text-2xl text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-red-600 dark:group-hover:text-rose-400 transition-colors">{n.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed line-clamp-2">{n.excerpt}</p>
                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Status: Published</span>
                  <SubmitWithConfirm
                    id={n.id}
                    action={deleteNews}
                    modalTitle="Hapus Artikel?"
                    modalDesc={`Anda yakin ingin menghapus artikel "${n.title}"? Aksi ini tidak dapat dibatalkan.`}
                    buttonElement={
                      <div className="flex items-center gap-2 text-red-500 dark:text-rose-400 font-bold hover:text-red-700 dark:hover:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-950/50 px-4 py-2 rounded-lg transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Hapus
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          {news?.length === 0 && (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
               <div className="w-16 h-16 mb-4 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 20H5V4h14v16zM7 16h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V6H7v2z"></path></svg>
              </div>
              <p className="text-lg">Belum ada artikel dipublikasikan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
