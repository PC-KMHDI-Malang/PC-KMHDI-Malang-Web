import { supabaseAdmin } from "@/lib/supabase";

// Server-only (dipakai di Server Component halaman detail). Menambah hitungan "dilihat" satu
// per kunjungan halaman, lalu mengembalikan angka terbaru supaya bisa langsung ditampilkan
// tanpa menunggu reload. Mengembalikan null kalau gagal — caller sebaiknya fallback ke
// angka views yang sudah ada di data yang telah diambil sebelumnya.
export async function incrementViewCount(table: "News" | "Ebook", id: string): Promise<number | null> {
  try {
    // Increment atomik lewat fungsi Postgres (lihat migrasi 018) supaya aman dari race condition
    // saat banyak pengunjung membuka halaman yang sama nyaris bersamaan.
    const { data, error: rpcError } = await supabaseAdmin.rpc("increment_counter", {
      p_table: table,
      p_column: "views",
      p_id: id,
      p_delta: 1,
    });

    if (!rpcError) return data as number;

    // Migrasi 018 belum dijalankan (fungsi belum ada) — fallback ke cara lama (non-atomik).
    if (!rpcError.message.includes("increment_counter")) throw rpcError;

    const { data: row, error: selectError } = await supabaseAdmin.from(table).select("views").eq("id", id).single();
    if (selectError) throw selectError;

    const current = typeof row?.views === "number" ? row.views : 0;
    const next = current + 1;

    const { error: updateError } = await supabaseAdmin.from(table).update({ views: next }).eq("id", id);
    if (updateError) throw updateError;

    return next;
  } catch (err) {
    console.error(`Gagal menambah views tabel ${table}:`, err);
    return null;
  }
}

export function formatViewCount(views: number): string {
  return views.toLocaleString("id-ID");
}
