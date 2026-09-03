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

export default function DataTable<T extends { id: string | number }>({ columns, data, emptyMessage = "Tidak ada data." }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 p-2 transition-colors">
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-4 sm:px-6 py-3.5 sm:py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-black dark:text-white font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="group transition-all duration-300 hover:bg-white dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0">
                  {columns.map((column, index) => (
                    <td
                      key={column.header}
                      className={`px-4 sm:px-6 py-3.5 sm:py-5 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors group-hover:text-black dark:group-hover:text-white ${index === 0 ? "rounded-l-2xl" : ""} ${index === columns.length - 1 ? "rounded-r-2xl" : ""}`}
                    >
                      {column.render ? column.render(row) : (row[column.key as keyof T] as ReactNode)}
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
