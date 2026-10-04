import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import { formatDate, formatPeriod, formatRupiah, MONTH_SHORT, type MonthStatus } from "@/lib/kas";
import type { KasReport } from "@/lib/kasReport";

// Pembuat file laporan iuran (Excel & PDF) untuk bendahara. Hanya dipanggil dari route
// app/(public)/kas/kelola/export/route.ts yang sudah memeriksa akun bendahara.

const ORG = "PC KMHDI Malang";

const STATUS_TEXT: Record<MonthStatus, string> = {
  LUNAS: "Sudah Bayar",
  MENUNGGU: "Menunggu",
  BELUM: "Belum Bayar",
  MENDATANG: "",
  TIDAK_BERLAKU: "-",
};

const IURAN_STATUS_TEXT = { LUNAS: "Sudah Bayar", MENUNGGU: "Menunggu Konfirmasi", DITOLAK: "Ditolak" } as const;

// Warna sel status, sama dengan warna di halaman kelola (hijau / kuning / merah).
const STATUS_RGB: Partial<Record<MonthStatus, [number, number, number]>> = {
  LUNAS: [209, 250, 229],
  MENUNGGU: [254, 243, 199],
  BELUM: [254, 226, 226],
};

function printedAt(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" }).format(new Date(iso)) + " WIB";
}

function settingText(report: KasReport): string {
  const { monthlyFee, startPeriod } = report.setting;
  return startPeriod ? `Iuran per bulan ${formatRupiah(monthlyFee)} (berlaku sejak ${formatPeriod(startPeriod)})` : "Iuran belum diatur";
}

export function reportFileName(report: KasReport, ext: "pdf" | "xlsx"): string {
  return `laporan-iuran-kas-${report.year}.${ext}`;
}

// ---------------------------------------------------------------------------------------------
// Excel
// ---------------------------------------------------------------------------------------------

const toArgb = ([r, g, b]: [number, number, number]) => "FF" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
const RUPIAH_FMT = '"Rp"#,##0';

export async function buildKasExcel(report: KasReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = ORG;
  wb.created = new Date(report.generatedAt);

  // Sheet 1: rekap anggota × bulan
  const ws = wb.addWorksheet(`Iuran ${report.year}`, { views: [{ state: "frozen", xSplit: 3, ySplit: 6 }] });
  const lastCol = 3 + 12 + 3;

  ws.mergeCells(1, 1, 1, lastCol);
  ws.getCell(1, 1).value = `Laporan Iuran Kas ${ORG} — Tahun ${report.year}`;
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, lastCol);
  ws.getCell(2, 1).value = `${settingText(report)} · Dicetak ${printedAt(report.generatedAt)}`;
  ws.getCell(2, 1).font = { color: { argb: "FF64748B" } };
  ws.mergeCells(3, 1, 3, lastCol);
  ws.getCell(3, 1).value = `Iuran masuk ${report.year}: ${formatRupiah(report.totals.yearPaid)} · Menunggu konfirmasi: ${report.totals.pendingCount} bulan · Total tunggakan: ${formatRupiah(report.totals.arrearsAmount)} (${report.totals.arrearsCount} bulan)`;
  ws.mergeCells(4, 1, 4, lastCol);
  ws.getCell(4, 1).value = "Isi kolom bulan: nominal = sudah bayar · Menunggu = menunggu konfirmasi · Belum Bayar = tunggakan · kosong = bulan mendatang · - = sebelum iuran berlaku";
  ws.getCell(4, 1).font = { italic: true, size: 9, color: { argb: "FF64748B" } };

  const header = ["No", "Nama", "Jabatan", ...MONTH_SHORT, `Dibayar ${report.year}`, "Tunggakan (bulan)", "Tunggakan (Rp)"];
  const headerRow = ws.getRow(6);
  headerRow.values = header;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
  });

  report.members.forEach((m, i) => {
    const row = ws.addRow([
      i + 1,
      m.name,
      m.jabatan ?? "",
      ...m.months.map((mo) => (mo.status === "LUNAS" ? mo.amount : STATUS_TEXT[mo.status])),
      m.yearPaid,
      m.arrearsCount,
      m.arrearsAmount,
    ]);
    m.months.forEach((mo, j) => {
      const cell = row.getCell(4 + j);
      cell.alignment = { horizontal: "center" };
      if (mo.status === "LUNAS") cell.numFmt = RUPIAH_FMT;
      const rgb = STATUS_RGB[mo.status];
      if (rgb) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(rgb) } };
    });
    row.getCell(16).numFmt = RUPIAH_FMT;
    row.getCell(18).numFmt = RUPIAH_FMT;
  });

  const totalRow = ws.addRow(["", "TOTAL", "", ...Array(12).fill(""), report.totals.yearPaid, report.totals.arrearsCount, report.totals.arrearsAmount]);
  totalRow.font = { bold: true };
  totalRow.getCell(16).numFmt = RUPIAH_FMT;
  totalRow.getCell(18).numFmt = RUPIAH_FMT;

  ws.columns.forEach((col, idx) => {
    col.width = idx === 0 ? 5 : idx === 1 ? 28 : idx === 2 ? 18 : idx >= 15 ? 16 : 12;
  });
  for (let r = 6; r <= ws.rowCount; r++) {
    ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
  }

  // Sheet 2: rincian setiap pembayaran di tahun itu
  const ws2 = wb.addWorksheet("Rincian Pembayaran", { views: [{ state: "frozen", ySplit: 1 }] });
  ws2.columns = [
    { header: "No", width: 5 },
    { header: "Nama", width: 28 },
    { header: "Periode", width: 16 },
    { header: "Tanggal Bayar", width: 18 },
    { header: "Nominal", width: 14 },
    { header: "Status", width: 22 },
    { header: "Catatan", width: 40 },
  ];
  ws2.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws2.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
  });
  report.payments.forEach((p, i) => {
    const row = ws2.addRow([i + 1, p.memberName, formatPeriod(p.period), formatDate(p.paidAt), p.amount, IURAN_STATUS_TEXT[p.status], p.note ?? ""]);
    row.getCell(5).numFmt = RUPIAH_FMT;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------------------------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------------------------

const PDF_STATUS_TEXT: Record<MonthStatus, string> = {
  LUNAS: "Bayar",
  MENUNGGU: "Tunggu",
  BELUM: "Belum",
  MENDATANG: "",
  TIDAK_BERLAKU: "-",
};

export function buildKasPdf(report: KasReport): Buffer {
  // Font bawaan PDF (Helvetica) hanya punya karakter WinAnsi — tanda pisah panjang "—" tidak ada,
  // jadi di PDF dipakai "-" biasa. "·" dan spasi pada format rupiah aman.
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Laporan Iuran Kas ${ORG} - Tahun ${report.year}`, margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${settingText(report)} · Dicetak ${printedAt(report.generatedAt)}`, margin, 20);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Iuran masuk ${report.year}: ${formatRupiah(report.totals.yearPaid)}   ·   Menunggu konfirmasi: ${report.totals.pendingCount} bulan   ·   Total tunggakan: ${formatRupiah(report.totals.arrearsAmount)} (${report.totals.arrearsCount} bulan)`,
    margin,
    26,
  );
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Keterangan: Bayar = sudah bayar · Tunggu = menunggu konfirmasi · Belum = belum bayar · kosong = bulan mendatang · - = sebelum iuran berlaku", margin, 31);
  doc.setTextColor(0, 0, 0);

  const monthStatuses = report.members.map((m) => m.months.map((mo) => mo.status));

  autoTable(doc, {
    startY: 35,
    margin: { left: margin, right: margin },
    head: [["No", "Nama", ...MONTH_SHORT, `Dibayar ${report.year}`, "Tunggakan"]],
    body: report.members.map((m, i) => [
      String(i + 1),
      m.jabatan ? `${m.name}\n${m.jabatan}` : m.name,
      ...m.months.map((mo) => PDF_STATUS_TEXT[mo.status]),
      formatRupiah(m.yearPaid),
      m.arrearsCount ? `${m.arrearsCount} bln\n${formatRupiah(m.arrearsAmount)}` : "Lunas",
    ]),
    foot: [["", "TOTAL", ...Array(12).fill(""), formatRupiah(report.totals.yearPaid), `${report.totals.arrearsCount} bln\n${formatRupiah(report.totals.arrearsAmount)}`]],
    showFoot: "lastPage",
    styles: { font: "helvetica", fontSize: 7, cellPadding: 1.4, valign: "middle", lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [185, 28, 28], textColor: 255, halign: "center", fontStyle: "bold" },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 46 },
      ...Object.fromEntries(MONTH_SHORT.map((_, j) => [j + 2, { cellWidth: 14, halign: "center" as const }])),
      14: { cellWidth: 27, halign: "right" },
      15: { cellWidth: 28, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index < 2 || data.column.index > 13) return;
      const status = monthStatuses[data.row.index]?.[data.column.index - 2];
      const rgb = status ? STATUS_RGB[status] : undefined;
      if (rgb) data.cell.styles.fillColor = rgb;
    },
  });

  // Rincian pembayaran di halaman berikutnya.
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Rincian Pembayaran ${report.year}`, margin, 14);
  autoTable(doc, {
    startY: 19,
    margin: { left: margin, right: margin },
    head: [["No", "Nama", "Periode", "Tanggal Bayar", "Nominal", "Status", "Catatan"]],
    body: report.payments.length
      ? report.payments.map((p, i) => [String(i + 1), p.memberName, formatPeriod(p.period), formatDate(p.paidAt), formatRupiah(p.amount), IURAN_STATUS_TEXT[p.status], p.note ?? ""])
      : [["", "Belum ada pembayaran di tahun ini.", "", "", "", "", ""]],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.6, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 10, halign: "center" }, 4: { halign: "right" } },
  });

  // Nomor halaman di setiap halaman.
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`${ORG} · Laporan Iuran ${report.year} · Halaman ${i} dari ${pages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 6, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
