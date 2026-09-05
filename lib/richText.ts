// Helper kecil untuk konten artikel yang disimpan sebagai HTML (dari RichTextEditor).

// Artikel lama disimpan sebagai teks polos (plain text, baris baru = "\n"). Ini dipakai untuk
// membedakan konten lama vs konten baru yang sudah berupa HTML, supaya keduanya tetap tampil benar.
export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

// Ubah HTML jadi teks polos untuk ringkasan/preview (kartu berita, meta description, dsb),
// supaya tag seperti <p>, <strong>, <img> tidak ikut tampil sebagai teks mentah.
export function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
