import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { statisticsData } from "@/data/statistics";
import { getIcon } from "@/lib/iconMap";
import { AddStatModal } from "@/components/admin/AddStatModal";
import { EditStatModal } from "@/components/admin/EditStatModal";
import { SubmitWithConfirm } from "@/components/ui/SubmitWithConfirm";
import { Trash2, AlertCircle, BarChart3, Sparkles, Save } from "lucide-react";

export default async function AdminStatisticsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-rose-500">Akses Ditolak</h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  const { data: dbItems, error: dbError } = await supabaseAdmin.from("Statistic").select("*").order("orderIndex", { ascending: true });
  const { data: section, error: sectionError } = await supabaseAdmin.from("StatisticSection").select("*").eq("id", 1).maybeSingle();

  const items = dbItems || [];
  const nextOrderIndex = items.length > 0 ? Math.max(...items.map((i) => i.orderIndex ?? 0)) + 10 : 10;

  // Server Action: Update konten section (badge, judul, deskripsi)
  async function updateSectionAction(formData: FormData) {
    "use server";
    const badge = formData.get("badge") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const heroCaptionValue1 = formData.get("heroCaptionValue1") as string;
    const heroCaptionLabel1 = formData.get("heroCaptionLabel1") as string;
    const heroCaptionValue2 = formData.get("heroCaptionValue2") as string;
    const heroCaptionLabel2 = formData.get("heroCaptionLabel2") as string;

    if (!badge || !title || !description) return;

    const updatePayload: Record<string, unknown> = { id: 1, badge, title, description, updatedAt: new Date().toISOString() };
    if (heroCaptionValue1) updatePayload.heroCaptionValue1 = heroCaptionValue1;
    if (heroCaptionLabel1) updatePayload.heroCaptionLabel1 = heroCaptionLabel1;
    if (heroCaptionValue2) updatePayload.heroCaptionValue2 = heroCaptionValue2;
    if (heroCaptionLabel2) updatePayload.heroCaptionLabel2 = heroCaptionLabel2;

    let { error } = await supabaseAdmin.from("StatisticSection").upsert(updatePayload);
    if (error && /heroCaption/i.test(error.message)) {
      // Kolom caption hero belum ada (migrasi 012 belum dijalankan) — simpan tanpa kolom tsb.
      delete updatePayload.heroCaptionValue1;
      delete updatePayload.heroCaptionLabel1;
      delete updatePayload.heroCaptionValue2;
      delete updatePayload.heroCaptionLabel2;
      const res = await supabaseAdmin.from("StatisticSection").upsert(updatePayload);
      error = res.error;
    }

    if (error) {
      throw new Error("Gagal menyimpan konten section: " + error.message);
    }

    revalidatePath("/admin/statistics");
    revalidatePath("/");
  }

  // Server Action: Tambah kartu statistik
  async function addStatAction(formData: FormData) {
    "use server";
    const value = formData.get("value") as string;
    const label = formData.get("label") as string;
    const icon = (formData.get("icon") as string) || "Users";
    const orderIndex = parseInt((formData.get("orderIndex") as string) || "10", 10);

    if (!value || !label) return;

    const { error } = await supabaseAdmin.from("Statistic").insert([{ value, label, icon, orderIndex: isNaN(orderIndex) ? 10 : orderIndex }]);

    if (error) {
      throw new Error("Gagal menambah statistik: " + error.message);
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

    if (!id || !value || !label) return;

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

  // Server Action: Hapus kartu statistik
  async function deleteStatAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;

    const { error } = await supabaseAdmin.from("Statistic").delete().eq("id", id);
    if (error) {
      throw new Error("Gagal menghapus statistik: " + error.message);
    }

    revalidatePath("/admin/statistics");
    revalidatePath("/");
  }

  // Server Action: Muat data awal (seed) jika tabel masih kosong
  async function seedInitialDataAction() {
    "use server";
    const payload = statisticsData.items.map((item, idx) => ({
      value: item.value,
      label: item.label,
      icon: item.icon,
      orderIndex: (idx + 1) * 10,
    }));

    await supabaseAdmin.from("Statistic").insert(payload);
    await supabaseAdmin.from("StatisticSection").upsert({
      id: 1,
      badge: statisticsData.badge,
      title: statisticsData.title,
      description: statisticsData.description,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/admin/statistics");
    revalidatePath("/");
  }

  const tablesMissing = !!dbError || !!sectionError;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Statistik Pencapaian</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">Kelola angka pencapaian yang tampil di section &ldquo;Pencapaian&rdquo; pada beranda.</p>
        </div>

        <div className="flex items-center gap-3">
          {items.length === 0 && !tablesMissing && (
            <form action={seedInitialDataAction}>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles size={14} />
                <span>Muat Data Awal</span>
              </button>
            </form>
          )}

          {!tablesMissing && <AddStatModal action={addStatAction} nextOrderIndex={nextOrderIndex} />}
        </div>
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

      {/* Form Konten Section (Badge, Judul, Deskripsi) */}
      {!tablesMissing && (
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Konten Section</h3>
              <p className="text-xs text-slate-400">Badge, judul, dan deskripsi yang tampil di atas kartu-kartu statistik</p>
            </div>
          </div>

          <form action={updateSectionAction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Badge</label>
              <input
                type="text"
                name="badge"
                required
                defaultValue={section?.badge || statisticsData.badge}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Judul</label>
              <input
                type="text"
                name="title"
                required
                defaultValue={section?.title || statisticsData.title}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Deskripsi</label>
              <textarea
                name="description"
                required
                rows={3}
                defaultValue={section?.description || statisticsData.description}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Caption di Hero (Beranda)</p>
              <p className="text-[11px] text-slate-400 mb-3">Angka kecil di bawah lambang pada bagian Hero (paling atas beranda).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="heroCaptionValue1"
                    placeholder="35+"
                    defaultValue={section?.heroCaptionValue1 || ""}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                  <input
                    type="text"
                    name="heroCaptionLabel1"
                    placeholder="Tahun Pengabdian"
                    defaultValue={section?.heroCaptionLabel1 || ""}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="heroCaptionValue2"
                    placeholder="500+"
                    defaultValue={section?.heroCaptionValue2 || ""}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                  <input
                    type="text"
                    name="heroCaptionLabel2"
                    placeholder="Kader Aktif"
                    defaultValue={section?.heroCaptionLabel2 || ""}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-bold shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Save size={15} />
                <span>Simpan Konten Section</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar Kartu Statistik */}
      {!tablesMissing && (
        <div className="bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Kartu Statistik</h3>
                <p className="text-xs text-slate-400">Total {items.length} kartu ditampilkan di section &ldquo;Pencapaian&rdquo; pada beranda</p>
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <BarChart3 size={36} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-sm">Belum ada kartu statistik.</p>
              <p className="text-xs text-slate-500 mt-1">Gunakan tombol &ldquo;Tambah Statistik&rdquo; atau &ldquo;Muat Data Awal&rdquo; untuk mulai mengisi.</p>
            </div>
          ) : (
            <>
              {/* MOBILE */}
              <div className="block md:hidden p-4 space-y-3">
                {items.map((stat) => {
                  const Icon = getIcon(stat.icon);
                  return (
                    <div key={stat.id} className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 p-4 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shrink-0">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 dark:text-white text-lg leading-snug truncate">{stat.value}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{stat.label}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 shrink-0">#{stat.orderIndex}</span>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-end gap-2">
                        <EditStatModal stat={stat} action={editStatAction} />
                        <SubmitWithConfirm
                          action={deleteStatAction}
                          id={stat.id}
                          modalTitle="Hapus Kartu Statistik?"
                          modalDesc={`Apakah Anda yakin ingin menghapus statistik "${stat.value} ${stat.label}"?`}
                          confirmText="Ya, Hapus"
                          buttonElement={
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer">
                              <Trash2 size={15} />
                            </div>
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP & TABLET */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-4 px-6">Ikon</th>
                      <th className="py-4 px-6">Nilai</th>
                      <th className="py-4 px-6">Label</th>
                      <th className="py-4 px-6 text-center">Urutan</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                    {items.map((stat) => {
                      const Icon = getIcon(stat.icon);
                      return (
                        <tr key={stat.id} className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition">
                          <td className="py-4 px-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                          </td>
                          <td className="py-4 px-6 font-black text-slate-900 dark:text-white text-lg">{stat.value}</td>
                          <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{stat.label}</td>
                          <td className="py-4 px-6 text-center font-mono text-xs text-slate-500">{stat.orderIndex}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <EditStatModal stat={stat} action={editStatAction} />
                              <SubmitWithConfirm
                                action={deleteStatAction}
                                id={stat.id}
                                modalTitle="Hapus Kartu Statistik?"
                                modalDesc={`Apakah Anda yakin ingin menghapus statistik "${stat.value} ${stat.label}"?`}
                                confirmText="Ya, Hapus"
                                buttonElement={
                                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer">
                                    <Trash2 size={15} />
                                  </div>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
