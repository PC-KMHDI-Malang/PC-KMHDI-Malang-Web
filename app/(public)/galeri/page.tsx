import { supabaseAdmin } from "@/lib/supabase";
import { galleryData } from "@/data/gallery";
import { GalleryGrid, GalleryItem } from "@/components/gallery/GalleryGrid";
import { Camera, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Galeri Dokumentasi | PC KMHDI Malang",
  description: "Dokumentasi kegiatan, pengabdian, kaderisasi, dan momentum kebersamaan PC KMHDI Malang.",
};

export default async function GaleriPage() {
  const { data: dbGallery } = await supabaseAdmin.from("Gallery").select("*").order("createdAt", { ascending: false });

  // Siapkan data dari Supabase
  const itemsFromDb: GalleryItem[] = (dbGallery || []).map((item) => ({
    id: item.id,
    title: item.title,
    coverImage: item.coverImage,
    description: item.description,
    createdAt: item.createdAt,
  }));

  // Fallback / gabungan dari foto lokal jika galeri database masih sedikit
  const localItems: GalleryItem[] = galleryData.images.map((img, idx) => ({
    id: `local-${idx + 1}`,
    title:
      [
        "Pelatihan Kaderisasi Mahasiswa Hindu",
        "Bakti Sosial & Pengabdian Masyarakat",
        "Seminar Nasional Kepemudaan",
        "Maha Sabha & Konferensi Cabang",
        "Perayaan Hari Besar Keagamaan",
        "Diskusi Publik Kebangsaan",
        "Pentas Seni & Budaya Nusantara",
        "Kunjungan Kerja Organisasi",
        "Rapat Kerja Pengurus Cabang",
      ][idx] || `Dokumentasi Kegiatan ${idx + 1}`,
    coverImage: img,
    description: "Momen kebersamaan dan dinamika perjuangan kader PC KMHDI Malang.",
    createdAt: new Date("2026-08-25T10:00:00.000Z").toISOString(),
  }));

  // Gabungkan database di depan, diikuti lokal jika total item masih sedikit
  const allItems = itemsFromDb.length >= 8 ? itemsFromDb : [...itemsFromDb, ...localItems];

  return (
    <div className="-mt-32 bg-white dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      {/* Header Banner Merah Megah */}
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-16 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-xl mb-4">
                <Camera size={14} />
                Dokumentasi Kegiatan
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">Galeri PC KMHDI Malang</h1>
              <p className="text-red-100/80 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
                Potret dinamika perjuangan, kaderisasi, pengabdian sosial, dan momentum kebersamaan kader Kesatuan Mahasiswa Hindu Dharma Indonesia Cabang Malang.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl text-white text-xs font-bold shadow-lg">
              <Sparkles size={16} className="text-amber-300" />
              <span>{allItems.length} Foto Tersedia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Grid Galeri */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl transition-colors">
          <GalleryGrid items={allItems} />
        </div>
      </div>
    </div>
  );
}
