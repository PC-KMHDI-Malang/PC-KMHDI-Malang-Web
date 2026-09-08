import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

// Node menjalankan file .ts secara langsung, tapi tidak membaca "paths" dari tsconfig.json —
// tanpa hook ini setiap import "@/lib/..." di dalam kode aplikasi gagal saat diuji.
const projectRoot = resolvePath(import.meta.dirname, "..");

export function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

  // tsconfig memetakan "@/x" ke file sumber tanpa ekstensi, jadi ekstensinya dicoba di sini.
  const base = resolvePath(projectRoot, specifier.slice(2));
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
  }
  return nextResolve(pathToFileURL(base).href, context);
}
