import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { STORAGE_BUCKETS, deleteFromBucketByUrl } from "@/lib/storage";
import { AddPartnerModal } from "@/components/admin/AddPartnerModal";
import { EditPartnerModal } from "@/components/admin/EditPartnerModal";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { Trash2, AlertCircle, Handshake, Globe, Instagram } from "lucide-react";

// Terima "@username", "username", atau link profil lengkap — selalu disimpan sebagai URL utuh.
function normalizeInstagramUrl(raw: string | null): string | null {
  const trimmed = raw?.trim() || "";
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
}

export default async function AdminMitraPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-rose-500">Akses Ditolak</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  const { data: partners, error: dbError } = await supabaseAdmin.from("Partner").select("*").order("orderIndex", { ascending: true });
  const items = partners || [];
  const nextOrderIndex = items.length > 0 ? Math.max(...items.map((i) => i.orderIndex ?? 0)) + 10 : 10;

  // Server Action: Tambah Mitra
  async function addPartnerAction(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const websiteUrlRaw = (formData.get("websiteUrl") as string)?.trim() || "";
    const websiteUrl = websiteUrlRaw ? (/^https?:\/\//i.test(websiteUrlRaw) ? websiteUrlRaw : `https://${websiteUrlRaw}`) : null;
    const instagramUrl = normalizeInstagramUrl(formData.get("instagramUrl") as string);
    const orderIndex = parseInt((formData.get("orderIndex") as string) || "10", 10);

    if (!name || !logoUrl) throw new Error("Nama dan logo mitra wajib diisi.");

    const insertPayload: Record<string, unknown> = { name, logoUrl, websiteUrl, instagramUrl, orderIndex: isNaN(orderIndex) ? 10 : orderIndex };
    let { error } = await supabaseAdmin.from("Partner").insert([insertPayload]);
    if (error && error.message.includes("instagramUrl")) {
      // Migrasi 017 (kolom instagramUrl) belum dijalankan — simpan tanpa kolom itu dulu daripada gagal total.
      delete insertPayload.instagramUrl;
      const res = await supabaseAdmin.from("Partner").insert([insertPayload]);
      error = res.error;
    }
    if (error) {
      throw new Error("Gagal menambah mitra: " + error.message);
    }

    revalidatePath("/admin/mitra");
    revalidatePath("/");
    revalidatePath("/mitra");
  }

  // Server Action: Edit Mitra
  async function editPartnerAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const websiteUrlRaw = (formData.get("websiteUrl") as string)?.trim() || "";
    const websiteUrl = websiteUrlRaw ? (/^https?:\/\//i.test(websiteUrlRaw) ? websiteUrlRaw : `https://${websiteUrlRaw}`) : null;
    const instagramUrl = normalizeInstagramUrl(formData.get("instagramUrl") as string);
    const orderIndex = parseInt((formData.get("orderIndex") as string) || "10", 10);

    if (!id || !name || !logoUrl) throw new Error("Nama dan logo mitra wajib diisi.");

    const updatePayload: Record<string, unknown> = { name, logoUrl, websiteUrl, instagramUrl, orderIndex: isNaN(orderIndex) ? 10 : orderIndex, updatedAt: new Date().toISOString() };
    let { error } = await supabaseAdmin.from("Partner").update(updatePayload).eq("id", id);
    if (error && error.message.includes("instagramUrl")) {
      // Migrasi 017 (kolom instagramUrl) belum dijalankan — simpan tanpa kolom itu dulu daripada gagal total.
      delete updatePayload.instagramUrl;
      const res = await supabaseAdmin.from("Partner").update(updatePayload).eq("id", id);
      error = res.error;
    }
    if (error) {
      throw new Error("Gagal menyimpan perubahan mitra: " + error.message);
    }

    revalidatePath("/admin/mitra");
    revalidatePath("/");
    revalidatePath("/mitra");
  }

  // Server Action: Hapus Mitra
  async function deletePartnerAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    const { data: partner } = await supabaseAdmin.from("Partner").select("logoUrl").eq("id", id).maybeSingle();
    await supabaseAdmin.from("Partner").delete().eq("id", id);

    if (partner?.logoUrl) {
      await deleteFromBucketByUrl(STORAGE_BUCKETS.partnerLogos, partner.logoUrl);
    }

    revalidatePath("/admin/mitra");
    revalidatePath("/");
    revalidatePath("/mitra");
  }

  const tableMissing = !!dbError;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Mitra & Kolaborasi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">Kelola logo lembaga/organisasi mitra yang tampil di beranda dan halaman /mitra.</p>
        </div>

        {!tableMissing && <AddPartnerModal action={addPartnerAction} nextOrderIndex={nextOrderIndex} />}
      </div>

      {/* Peringatan Jika Tabel Belum Dibuat di Supabase */}
      {tableMissing && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>Tabel Database &ldquo;Partner&rdquo; Belum Dibuat di Supabase</span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
            Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, lalu salin dan jalankan skrip migrasi yang telah disiapkan di file:{" "}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">supabase/migrations/015_create_partner_table.sql</code>. Setelah itu, muat ulang halaman ini.
          </p>
        </div>
      )}

      {/* Daftar Mitra */}
      {!tableMissing && (
        <div className="bg-white dark:bg-[#111114] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Handshake size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Daftar Mitra</h3>
                <p className="text-xs text-slate-400">Total {items.length} mitra terdaftar</p>
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Handshake size={36} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-sm">Belum ada mitra yang ditambahkan.</p>
              <p className="text-xs text-slate-500 mt-1">Gunakan tombol &ldquo;Tambah Mitra&rdquo; untuk mulai mengisi.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((partner) => (
                <div key={partner.id} className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-[#1c1c22] border border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-center p-2">
                      {/* Logo mitra ukuran kecil & bervariasi bentuknya — img biasa lebih sederhana daripada next/image di sini */}
                      <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug truncate">{partner.name}</h4>
                      {partner.instagramUrl ? (
                        <a href={partner.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 truncate">
                          <Instagram size={11} className="shrink-0" />
                          <span className="truncate">{partner.instagramUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")}</span>
                        </a>
                      ) : partner.websiteUrl ? (
                        <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 truncate">
                          <Globe size={11} className="shrink-0" />
                          <span className="truncate">{partner.websiteUrl.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">Tanpa tautan</span>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 shrink-0">#{partner.orderIndex}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-end gap-2">
                    <EditPartnerModal partner={partner} action={editPartnerAction} />
                    <SubmitWithConfirm
                      action={deletePartnerAction}
                      id={partner.id}
                      modalTitle="Hapus Mitra?"
                      modalDesc={`Apakah Anda yakin ingin menghapus mitra "${partner.name}"?`}
                      confirmText="Ya, Hapus"
                      buttonElement={
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer">
                          <Trash2 size={15} />
                        </div>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
