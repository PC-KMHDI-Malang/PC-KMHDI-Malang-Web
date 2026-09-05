import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { STORAGE_BUCKETS, uploadToBucket, deleteFromBucketByUrl, deleteManyFromBucketByUrls, extractBucketUrlsFromHtml, listBucketFiles } from "@/lib/storage";
import { generateUniqueNewsSlug } from "@/lib/slug";
import Link from "next/link";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { AddNewsModal } from "@/components/admin/AddNewsModal";
import { RedirectToast } from "@/components/admin/RedirectToast";

export default async function NewsAdminPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-rose-500">Akses Ditolak</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  const { data: news, error } = await supabaseAdmin.from("News").select("*, Category(name), author:User!authorId(name)").order("createdAt", { ascending: false });
  const { data: categories } = await supabaseAdmin.from("Category").select("id, name").order("name");

  async function addNews(formData: FormData) {
    "use server";
    try {
      const title = formData.get("title") as string;
      const excerpt = formData.get("excerpt") as string;
      const content = formData.get("content") as string;
      const coverImageUrl = formData.get("coverImageUrl") as string | null;
      const authorName = (formData.get("authorName") as string)?.trim() || null;
      const categoryName = (formData.get("categoryName") as string)?.trim() || "Umum";

      if (!coverImageUrl) return { error: "Gambar cover wajib diisi." };
      const coverImage = coverImageUrl;

      const slug = await generateUniqueNewsSlug(title);

      const catSlug = categoryName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      // Check if category exists
      let { data: existingCat, error: findError } = await supabaseAdmin.from("Category").select("id").eq("slug", catSlug).maybeSingle();
      let finalCategoryId;

      if (findError) console.error("Error finding category:", findError);

      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const { data: newCat, error: insertCatError } = await supabaseAdmin
          .from("Category")
          .insert([{ name: categoryName, slug: catSlug }])
          .select()
          .single();
        if (insertCatError) console.error("Error inserting category:", insertCatError);
        if (newCat) finalCategoryId = newCat.id;
      }

      const authSession = await auth();
      if (authSession?.user?.role !== "ADMIN") throw new Error("Unauthorized");

      const { error: insertNewsError } = await supabaseAdmin.from("News").insert([
        {
          title,
          slug,
          excerpt,
          content,
          coverImage,
          status: "PUBLISHED",
          authorId: authSession.user.id,
          authorName: authorName || authSession.user.name || "Admin",
          categoryId: finalCategoryId,
        },
      ]);

      if (insertNewsError) throw insertNewsError;

      revalidatePath("/admin/news");
      revalidatePath("/");
      return { success: true, message: "Artikel berhasil diterbitkan!" };
    } catch (err: any) {
      return { error: err.message || "Gagal menerbitkan artikel." };
    }
  }

  async function deleteNews(formData: FormData) {
    "use server";
    try {
      const authSession = await auth();
      if (authSession?.user?.role !== "ADMIN") throw new Error("Unauthorized");

      const id = formData.get("id") as string;
      if (!id) return { error: "ID tidak ditemukan" };

      const { data: article } = await supabaseAdmin.from("News").select("coverImage, content").eq("id", id).maybeSingle();
      const { error } = await supabaseAdmin.from("News").delete().eq("id", id);
      if (error) throw error;

      if (article?.coverImage) await deleteFromBucketByUrl(STORAGE_BUCKETS.news, article.coverImage);
      // Gambar yang disisip lewat RichTextEditor hidup di dalam HTML "content", bukan kolom
      // terpisah — tanpa ini, semua gambar sisipan artikel yang dihapus akan tertinggal permanen.
      await deleteManyFromBucketByUrls(STORAGE_BUCKETS.articleImages, extractBucketUrlsFromHtml(STORAGE_BUCKETS.articleImages, article?.content));

      revalidatePath("/admin/news");
      revalidatePath("/");
      return { success: true, message: "Artikel berhasil dihapus!" };
    } catch (err: any) {
      return { error: err.message || "Gagal menghapus artikel." };
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <RedirectToast param="updated" message="Artikel berhasil diperbarui." />
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Manajemen Artikel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Kelola artikel dan berita yang akan ditampilkan di halaman utama.</p>
        </div>
        <AddNewsModal action={addNews} />
      </div>

      <div className="bg-white dark:bg-[#111114] p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-slate-800 dark:bg-slate-300 rounded-full inline-block"></span>
            Daftar Artikel
          </h2>
          <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-sm font-semibold">{news?.length || 0} Diterbitkan</span>
        </div>
        {error && <p className="text-red-500 mb-4 font-medium">Gagal mengambil data.</p>}

        <div className="space-y-6">
          {news?.map((n) => (
            <div
              key={n.id}
              className="group border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row bg-white dark:bg-[#111114] hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-full md:w-64 h-48 md:h-auto relative overflow-hidden bg-slate-100 dark:bg-white/5">
                <img src={n.coverImage} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-red-50 dark:bg-rose-950/30 text-red-600 dark:text-rose-400 rounded-full text-xs font-bold tracking-wider uppercase border border-red-100 dark:border-rose-900/30">
                    {n.Category?.name || "UMUM"}
                  </span>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-red-600 dark:group-hover:text-rose-400 transition-colors">{n.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-2">{n.excerpt}</p>
                <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-50 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">Penulis: {n.authorName || n.author?.name || "Admin KMHDI"}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/news/${n.id}`}
                      className="flex items-center gap-2 text-blue-500 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                      Edit
                    </Link>
                    <SubmitWithConfirm
                      id={n.id}
                      action={deleteNews}
                      modalTitle="Hapus Artikel?"
                      modalDesc={`Anda yakin ingin menghapus artikel "${n.title}"? Aksi ini tidak dapat dibatalkan.`}
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
          {news?.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 mb-4 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 20H5V4h14v16zM7 16h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V6H7v2z"></path>
                </svg>
              </div>
              <p className="text-lg">Belum ada artikel dipublikasikan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
