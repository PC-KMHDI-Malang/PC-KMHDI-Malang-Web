// Nilai di dalam filter .or() PostgREST dipisahkan oleh koma dan tanda kurung, jadi teks
// pencarian dari pengguna tidak boleh ditempel mentah ke dalamnya: input seperti "a)" atau
// "a,role.eq.ADMIN" ikut terbaca sebagai bagian dari filter, bukan sebagai kata yang dicari —
// hasilnya query melenceng dari maksudnya, atau Postgres melempar error dan halamannya jadi 500.
//
// Membungkus nilainya sebagai literal berkutip ganda membuat seluruh isinya diperlakukan sebagai
// teks biasa. Di dalam kutip itu hanya backslash dan kutip ganda yang perlu di-escape.
export function orFilterLiteral(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Pola ilike untuk pencarian "mengandung kata ini", sudah aman dipakai di dalam .or().
export function containsPattern(value: string): string {
  return orFilterLiteral(`%${value}%`);
}
