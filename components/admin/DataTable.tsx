"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  emptyMessage = "Tidak ada data.",
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-2">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-black"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="group transition-all duration-300 hover:bg-white border-b border-slate-50 last:border-0"
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.header}
                      className={`px-6 py-5 text-sm font-medium text-slate-700 transition-colors group-hover:text-black ${index === 0 ? 'rounded-l-2xl' : ''} ${index === columns.length - 1 ? 'rounded-r-2xl' : ''}`}
                    >
                      {column.render
                        ? column.render(row)
                        : (row[column.key as keyof T] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}