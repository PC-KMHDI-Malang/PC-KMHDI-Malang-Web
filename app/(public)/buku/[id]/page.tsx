import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Tag, Share2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { EbookShareBar } from "@/components/ui/EbookShareBar";
import { LoginPromptModal } from "@/components/ui/LoginPromptModal";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: ebook } = await supabaseAdmin
    .from("Ebook")
    .select("title, description, coverImage, genre, publisher")
    .eq("id", id)
    .single();

  if (!ebook) {
    return { title: "e-Book Tidak Ditemukan | PC KMHDI Malang" };
  }

  const desc = ebook.description || `e-Book kategori ${ebook.genre} diterbitkan oleh ${ebook.publisher || "PP KMHDI"}.`;

  return {
    title: `${ebook.title} | e-Book PC KMHDI Malang`,
    description: desc,
    openGraph: {
      title: ebook.title,
      description: desc,
      url: `/buku/${id}`,
      siteName: "PC KMHDI Malang",
      images: ebook.coverImage ? [{ url: ebook.coverImage, width: 800, height: 1100, alt: ebook.title }] : [],
      type: "book",
    },
    twitter: {
      card: "summary_large_image",
      title: ebook.title,
      description: desc,
      images: ebook.coverImage ? [ebook.coverImage] : [],
    },
  };
}

export default async function EbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: ebook }, session] = await Promise.all([
    supabaseAdmin.from("Ebook").select("*").eq("id", id).single(),
    auth(),
  ]);

  if (!ebook) {
    notFound();
  }

  const { data: related } = await supabaseAdmin
    .from("Ebook")
    .select("*")
    .eq("genre", ebook.genre)
    .neq("id", ebook.id)
    .order("createdAt", { ascending: false })
    .limit(4);

  const isLoggedIn = !!session?.user;
  const loginHref = `/login?callbackUrl=${encodeURIComponent("/")}`;

  return (
    <div className="-mt-32 bg-white dark:bg-slate-950 transition-colors">
      {/* Dark header behind navbar */}
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-10 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-50 w-50 rounded-full bg-red-500/20 blur-[180px]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <Link
            href="/buku"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-100/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Kembali ke Koleksi e-Book
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-10">

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_1fr] gap-10">
          <div className="rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 p-8 flex items-center justify-center">
            <div className="relative w-40 sm:w-48 aspect-[3/4] shadow-[10px_10px_20px_rgba(0,0,0,0.2),-3px_0_5px_rgba(0,0,0,0.1)] rounded-r-xl rounded-l-sm">
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/40 via-white/10 to-transparent z-10 rounded-l-sm"></div>
              <img src={ebook.coverImage} alt={ebook.title} className="w-full h-full object-cover rounded-r-xl rounded-l-sm" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">{ebook.title}</h1>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 dark:text-slate-500">Tahun Terbit</p>
                <p className="text-base font-bold text-slate-800 dark:text-white mt-1">{ebook.publishYear || new Date(ebook.createdAt).getFullYear()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 dark:text-slate-500">Nama Penerbit</p>
                <p className="text-base font-bold text-slate-800 dark:text-white mt-1">{ebook.publisher || "PP KMHDI"}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {isLoggedIn ? (
                <a
                  href={ebook.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 dark:bg-rose-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm text-sm"
                >
                  <Eye size={16} />
                  Baca Online
                </a>
              ) : (
                <LoginPromptModal
                  loginHref={loginHref}
                  triggerLabel="Baca Online"
                  triggerIcon={<Eye size={16} />}
                  triggerClassName="inline-flex items-center gap-2 bg-red-600 dark:bg-rose-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm text-sm"
                />
              )}
            </div>

            <div className="mt-10">
              <div className="flex items-center gap-6 border-b border-slate-100 dark:border-white/5">
                <span className="pb-3 text-sm font-bold text-red-600 dark:text-rose-500 border-b-2 border-red-600 dark:border-rose-500">Penjelasan</span>
              </div>
              <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed">
                {ebook.description || "Belum ada deskripsi untuk e-book ini."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Tag :</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
              <Tag size={12} />
              {ebook.genre}
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 sm:justify-end">
              <Share2 size={14} />
              Bagikan:
            </p>
            <EbookShareBar
              title={ebook.title}
              type="ebook"
              id={ebook.id}
              initialLikes={ebook.likes || 0}
              coverImage={ebook.coverImage}
              categoryOrGenre={ebook.genre}
              authorOrPublisher={ebook.publisher || "PP KMHDI"}
              date={new Date(ebook.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              description={ebook.description}
            />
          </div>
        </div>

        {related && related.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">e-Book Terkait</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">e-Book lainnya yang terkait...</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/buku/${item.id}`}
                  className="group rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-40 bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="flex flex-col items-center gap-1.5" title="View">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                          <Eye size={18} />
                        </span>
                        <span className="text-white text-xs font-semibold drop-shadow">View</span>
                      </span>
                    </div>
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wide">
                      {item.genre}
                    </span>
                    <span className="absolute bottom-3 left-3 inline-flex items-center px-2.5 py-1 bg-slate-900/70 text-white rounded-md text-[10px] font-semibold">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">{item.title}</h3>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.publisher || "PP KMHDI"}</p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.publishYear || new Date(item.createdAt).getFullYear()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
