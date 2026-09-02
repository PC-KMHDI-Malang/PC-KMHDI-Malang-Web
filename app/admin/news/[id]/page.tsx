import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { STORAGE_BUCKETS, uploadToBucket, deleteFromBucketByUrl, getBucketUsage } from "@/lib/storage";
import { ImagePicker } from "@/components/ui/ImagePicker";

import { CategorySelect } from "@/components/admin/CategorySelect";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const { data: news, error } = await supabaseAdmin.from("News").select("*, Category(name)").eq("id", id).single();

  if (error || !news) {
    return <div className="p-8 text-center text-red-500">Artikel tidak ditemukan</div>;
  }

  const usage = await getBucketUsage(STORAGE_BUCKETS.news);

  async function editNews(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const coverImageUrl = formData.get("coverImageUrl") as string | null;
    const authorName = (formData.get("authorName") as string)?.trim() || null;
    const categoryName = (formData.get("categoryName") as string)?.trim();

    const authSession = await auth();
    if (!authSession?.user?.id) throw new Error("Unauthorized");

    let finalCategoryId;

    if (categoryName) {
      const catSlug = categoryName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      let { data: existingCat, error: findError } = await supabaseAdmin.from("Category").select("id").eq("slug", catSlug).maybeSingle();

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
    }

    const updateData: Record<string, unknown> = { title, excerpt, content, authorName };

    if (finalCategoryId) {
      updateData.categoryId = finalCategoryId;
    }

    if (coverImageUrl && coverImageUrl !== news.coverImage) {
      updateData.coverImage = coverImageUrl;
    }

    const { error: updateError } = await supabaseAdmin.from("News").update(updateData).eq("id", id);
    if (updateError) {
      console.error("Failed to update news:", updateError);
      throw new Error(`Failed to update: ${updateError.message}`);
    }

    revalidatePath("/admin/news");
    revalidatePath("/");
    redirect("/admin/news");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">Edit Artikel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg transition-colors">Perbarui informasi artikel Anda.</p>
        </div>
        <Link href="/admin/news" className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
          Kembali
        </Link>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 mb-10 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-600 dark:bg-blue-500 rounded-full inline-block"></span>
          Form Edit Artikel
        </h2>
        <form action={editNews} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Artikel</label>
            <input
              type="text"
              name="title"
              defaultValue={news.title}
              required
              className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-xl p-3 outline-none transition-all text-lg font-semibold"
              placeholder="Masukkan judul menarik..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ringkasan (Excerpt)</label>
            <textarea
              name="excerpt"
              defaultValue={news.excerpt}
              required
              className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-xl p-3 outline-none transition-all"
              rows={2}
              placeholder="Satu atau dua kalimat untuk menarik minat pembaca..."
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Isi Artikel Lengkap</label>
            <textarea
              name="content"
              defaultValue={news.content}
              required
              className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-xl p-4 outline-none transition-all leading-relaxed"
              rows={12}
              placeholder="Ketik isi lengkap artikel Anda di sini..."
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gambar Cover</label>
            <ImagePicker bucket={STORAGE_BUCKETS.news} defaultImageUrl={news.coverImage || ""} usedBytes={usage.usedBytes} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorySelect defaultCategoryName={news.Category?.name || "Umum"} />
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Penulis</label>
              <input
                type="text"
                name="authorName"
                defaultValue={news.authorName ?? ""}
                className="w-full bg-slate-50 dark:bg-[#111111] dark:text-white border border-slate-200 dark:border-white/5 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 rounded-xl p-3 outline-none transition-all"
                placeholder="Kosongkan untuk memakai nama akun penulis asli"
              />
            </div>
          </div>
          <div className="pt-2 flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 dark:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 dark:hover:shadow-blue-900/30 transition-all duration-300"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
