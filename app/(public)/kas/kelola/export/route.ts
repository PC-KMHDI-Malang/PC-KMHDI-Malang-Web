import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { currentPeriod, isTreasurerEmail, parseYearParam } from "@/lib/kas";
import { loadKasReport } from "@/lib/kasReport";
import { buildKasExcel, buildKasPdf, reportFileName } from "@/lib/kasExport";

// Unduh laporan iuran satu tahun: /kas/kelola/export?format=pdf|xlsx&tahun=2026.
// Middleware sudah membatasi /kas/kelola* ke akun bendahara; route ini tetap memeriksa sendiri
// karena isinya data iuran seluruh anggota.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !isTreasurerEmail(session.user.email)) {
    return new NextResponse("Hanya akun bendahara yang dapat mengunduh laporan kas.", { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const format = params.get("format") === "xlsx" ? "xlsx" : "pdf";
  const year = parseYearParam(params.get("tahun") ?? undefined, Number(currentPeriod().slice(0, 4)));

  let report;
  try {
    report = await loadKasReport(year);
  } catch {
    return new NextResponse("Gagal membaca data iuran. Coba lagi nanti.", { status: 500 });
  }

  const body = format === "xlsx" ? await buildKasExcel(report) : buildKasPdf(report);
  const contentType = format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf";

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${reportFileName(report, format)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
