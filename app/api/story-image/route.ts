import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Proxy gambar sampul untuk kartu Instagram Stories (lib/generateStoryCard.ts). Kartu digambar
// di <canvas>, dan canvas hanya mau memakai gambar dari origin lain kalau server-nya mengirim
// header CORS — bucket R2/Supabase maupun gambar hotlink dari situs lain umumnya tidak. Lewat
// route ini gambarnya disajikan dari origin situs sendiri, jadi canvas bisa memakainya.

const MAX_BYTES = 10 * 1024 * 1024;

// Tolak alamat jaringan internal supaya route ini tidak bisa dipakai untuk SSRF.
function isPrivateAddress(ip: string) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const lower = ip.toLowerCase();
  if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));
  return lower === "::" || lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  let target: URL;
  try {
    target = new URL(raw ?? "");
  } catch {
    return new NextResponse("URL tidak valid", { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new NextResponse("URL tidak valid", { status: 400 });
  }

  try {
    const addresses = await lookup(target.hostname, { all: true });
    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
      return new NextResponse("Host tidak diizinkan", { status: 400 });
    }
  } catch {
    return new NextResponse("Host tidak ditemukan", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { redirect: "error", signal: AbortSignal.timeout(10000) });
  } catch {
    return new NextResponse("Gagal mengambil gambar", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  // SVG ditolak: bisa berisi script, dan di sini disajikan dari origin situs sendiri.
  if (!upstream.ok || !contentType.startsWith("image/") || contentType.includes("svg")) {
    return new NextResponse("Gambar tidak tersedia", { status: 502 });
  }
  if (Number(upstream.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return new NextResponse("Gambar terlalu besar", { status: 413 });
  }

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return new NextResponse("Gambar terlalu besar", { status: 413 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      // URL upload selalu unik (randomUUID di lib/storage.ts), jadi aman di-cache lama.
      "Cache-Control": "public, max-age=86400, s-maxage=2592000",
    },
  });
}
