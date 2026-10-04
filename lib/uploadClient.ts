import { createUploadUrlAction, uploadFileAction } from "@/lib/actions";
import { SERVER_UPLOAD_MAX_BYTES } from "@/lib/uploadLimits";

// Satu pintu upload untuk semua komponen admin (ImagePicker, FilePicker, RichTextEditor, modal
// pengurus). Mengembalikan URL file yang siap disimpan ke database — bentuknya sama persis
// seperti sebelumnya, jadi komponen pemanggil tidak perlu tahu jalur mana yang dipakai.
//
// 1. Minta link upload sementara ke server (server memvalidasi login, jenis & ukuran file).
// 2. Kirim file langsung dari browser ke R2 lewat link itu — tidak lewat Vercel, jadi PDF
//    sampai 10 MB pun bisa (batas body request Vercel 4.5 MB).
// 3. Kalau R2 belum dikonfigurasi, atau upload langsung diblokir browser (mis. CORS di domain
//    preview), file kecil dikirim lewat server seperti cara lama.
export async function uploadFile(file: File, bucket: string): Promise<string> {
  const viaServer = () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    return uploadFileAction(formData);
  };

  const target = await createUploadUrlAction({ bucket, fileName: file.name, contentType: file.type, size: file.size });
  if (target.mode === "server") return viaServer();

  let response: Response;
  try {
    response = await fetch(target.uploadUrl, { method: "PUT", headers: target.headers, body: file });
  } catch {
    if (file.size <= SERVER_UPLOAD_MAX_BYTES) return viaServer();
    throw new Error("Koneksi ke storage terputus. Coba lagi.");
  }

  if (!response.ok) throw new Error(`Upload ke storage gagal (HTTP ${response.status}).`);
  return target.fileUrl;
}
