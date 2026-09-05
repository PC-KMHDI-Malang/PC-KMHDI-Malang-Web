import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getIcon } from "@/lib/iconMap";
import { EditStatModal } from "@/components/admin/EditStatModal";
import { EditHeroCaptionModal } from "@/components/admin/EditHeroCaptionModal";
import { AlertCircle, BarChart3, CalendarDays, Users } from "lucide-react";

export default async function AdminStatisticsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-rose-500">Akses Ditolak</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  const { data: dbItems, error: dbError } = await supabaseAdmin.from("Statistic").select("*").order("orderIndex", { ascending: true });
  const { data: section, error: sectionError } = await supabaseAdmin.from("StatisticSection").select("*").eq("id", 1).maybeSingle();

  const items = dbItems || [];

  // Server Action: Update caption hero
  async function updateSectionAction(formData: FormData) {
    "use server";
    const heroCaptionValue1 = formData.get("heroCaptionValue1") as string;
    const heroCaptionValue2 = formData.get("heroCaptionValue2") as string;

    const updatePayload: Record<string, unknown> = { id: 1, updatedAt: new Date().toISOString() };
    if (heroCaptionValue1) updatePayload.heroCaptionValue1 = heroCaptionValue1;
    if (heroCaptionValue2) updatePayload.heroCaptionValue2 = heroCaptionValue2;

    let { error } = await supabaseAdmin.from("StatisticSection").upsert(updatePayload);
    if (error && /heroCaption/i.test(error.message)) {
      // Kolom caption hero belum ada (migrasi 012 belum dijalankan) — simpan tanpa kolom tsb.
      delete updatePayload.heroCaptionValue1;
      delete updatePayload.heroCaptionValue2;
      const res = await supabaseAdmin.from("StatisticSection").upsert(updatePayload);
      error = res.error;
    }

    if (error) {
      throw new Error("Gagal menyimpan konten section: " + error.message);
    }

    revalidatePath("/admin/statistics");
    revalidatePath("/");
  }

  // Server Action: Edit kartu statistik
  async function editStatAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const value = formData.get("value") as string;
    const label = formData.get("label") as string;
    const icon = (formData.get("icon") as string) || "Users";
    const orderIndex = parseInt((formData.get("orderIndex") as string) || "10", 10);

    if (!id || !value || !label) throw new Error("Nilai dan label wajib diisi.");

    const { error } = await supabaseAdmin
      .from("Statistic")
      .update({ value, label, icon, orderIndex: isNaN(orderIndex) ? 10 : orderIndex, updatedAt: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error("Gagal menyimpan perubahan: " + error.message);
    }

    revalidatePath("/admin/statistics");
    revalidatePath("/");
  }

  const tablesMissing = !!dbError || !!sectionError;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Hero &amp; Statistik</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">Kelola caption di Hero beranda dan angka pada kartu statistik.</p>
      </div>

      {/* Peringatan Jika Tabel Belum Dibuat di Supabase */}
      {tablesMissing && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>Tabel Database &ldquo;Statistic&rdquo; / &ldquo;StatisticSection&rdquo; Belum Dibuat di Supabase</span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
            Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, lalu salin dan jalankan skrip migrasi yang telah disiapkan di file:{" "}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">supabase/migrations/011_create_statistic_table.sql</code>. Setelah itu, muat ulang halaman ini.
          </p>
        </div>
      )}

      {/* Form Caption Hero */}
      {!tablesMissing && (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
          <div className="mb-5">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Caption Hero</h3>
            <p className="text-xs text-slate-400 mt-0.5">Dua angka kecil di bawah lambang pada bagian Hero (paling atas beranda)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200/90 dark:border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-lg leading-snug truncate">{section?.heroCaptionValue1 || "35+"}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{section?.heroCaptionLabel1 || "Tahun Pengabdian"}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <EditHeroCaptionModal fieldName="heroCaptionValue1" label={section?.heroCaptionLabel1 || "Tahun Pengabdian"} value={section?.heroCaptionValue1 || "35+"} action={updateSectionAction} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-lg leading-snug truncate">{section?.heroCaptionValue2 || "500+"}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{section?.heroCaptionLabel2 || "Kader Aktif"}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <EditHeroCaptionModal fieldName="heroCaptionValue2" label={section?.heroCaptionLabel2 || "Kader Aktif"} value={section?.heroCaptionValue2 || "500+"} action={updateSectionAction} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daftar Kartu Statistik */}
      {!tablesMissing && (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden transition-colors">
          <div className="p-6 pb-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Kartu Statistik</h3>
            <p className="text-xs text-slate-400 mt-0.5">Angka pada kartu-kartu pencapaian di beranda</p>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <BarChart3 size={36} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-sm">Belum ada kartu statistik di database.</p>
              <p className="text-xs text-slate-500 mt-1">Hubungi developer untuk mengisi data awal lewat Supabase.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 pt-0 sm:pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {items.map((stat) => {
                const Icon = getIcon(stat.icon);
                return (
                  <div key={stat.id} className="rounded-xl border border-slate-200/90 dark:border-white/10 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-snug truncate">{stat.value}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{stat.label}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-end">
                      <EditStatModal stat={stat} action={editStatAction} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
