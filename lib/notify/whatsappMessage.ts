// Teks pesan WhatsApp untuk grup — murni (hanya string) supaya bisa diuji unit.
//
// Yang SENGAJA tidak dimasukkan: tautan rapat daring (locationDetail) dan catatan peserta
// (internalNote). Isi grup WhatsApp berada di luar perlindungan login situs ini — siapa pun yang
// ada di grup (atau yang menerima forward-nya) bisa membacanya — jadi pesan hanya memuat
// ringkasan kejadian, dan detail lengkapnya tetap di halaman agenda yang wajib login.

// Tanda * dihapus dari teks pengguna karena pesan memakai *tebal* ala WhatsApp: tanpa ini, judul
// seperti "Rapat *penting*" merusak format pesan.
function plain(value: string): string {
  return value.replace(/\*/g, "").trim();
}

export function buildWhatsAppMessage(input: { title: string; body: string; audience: string; url: string }): string {
  return [`*${plain(input.title)}*`, plain(input.body), `Untuk: ${plain(input.audience)}`, "", `Detail (khusus anggota, perlu login):`, input.url].join("\n");
}
