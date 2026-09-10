import { requireAdmin } from "@/lib/guard";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { AlertCircle, Megaphone } from "lucide-react";
import { PopupAdForm } from "@/components/admin/PopupAdForm";
import { STORAGE_BUCKETS, deleteFromBucketByUrl } from "@/lib/storage";

export default async function AdminPopupPage() {
  const { data: popup, error } = await supabaseAdmin.from("PopupAd").select("*").eq("id", 1).maybeSingle();

  async function updatePopupAction(formData: FormData) {
    "use server";
    await requireAdmin();
    const imageUrl = (formData.get("imageUrl") as string) || null;
    const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
    const isActive = formData.get("isActive") === "true";

    const { error } = await supabaseAdmin.from("PopupAd").upsert({ id: 1, imageUrl, linkUrl, isActive, updatedAt: new Date().toISOString() });

    if (error) throw new Error("Gagal menyimpan pengaturan pop-up: " + error.message);

    // Gambar lama dihapus dari bucket Supabase begitu diganti dengan yang baru, atau dikosongkan
    // lewat tombol "x" di ImagePicker — tanpa ini, file lama tertinggal permanen di storage
    // walau sudah tidak dipakai di mana pun.
    if (popup?.imageUrl && popup.imageUrl !== imageUrl) {
      await deleteFromBucketByUrl(STORAGE_BUCKETS.popupAds, popup.imageUrl);
    }

    revalidatePath("/admin/popup");
    // Pop-up ini dibaca di app/(public)/layout.tsx dan tampil di semua halaman publik. Halaman
    // yang sudah di-cache statis (lihat catatan "Di-cache" di masing-masing file) tidak ikut
    // ter-update otomatis lewat satu revalidatePath("/") saja, jadi didaftar satu per satu di
    // sini — sama seperti pola yang sudah dipakai untuk galeri/mitra/profil.
    revalidatePath("/");
    revalidatePath("/galeri");
    revalidatePath("/mitra");
    revalidatePath("/profil");
    revalidatePath("/program");
  }

  const tableMissing = !!error;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Pop-up Iklan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">Kelola poster yang tampil sebagai pop-up saat pengunjung pertama kali membuka situs.</p>
      </div>

      {tableMissing && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>Tabel Database &ldquo;PopupAd&rdquo; Belum Dibuat di Supabase</span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
            Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, lalu salin dan jalankan skrip migrasi yang telah disiapkan di file:{" "}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">supabase/migrations/024_create_popup_ad_table.sql</code>. Setelah itu, muat ulang halaman ini.
          </p>
        </div>
      )}

      {!tableMissing && (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Pengaturan Pop-up</h3>
              <p className="text-xs text-slate-400 mt-0.5">Poster, tautan tujuan, dan sakelar aktif/nonaktif</p>
            </div>
          </div>

          <PopupAdForm imageUrl={popup?.imageUrl || ""} linkUrl={popup?.linkUrl || ""} isActive={popup?.isActive || false} action={updatePopupAction} />
        </div>
      )}
    </div>
  );
}
