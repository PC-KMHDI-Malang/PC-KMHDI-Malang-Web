"use client";

import { useState } from "react";
import { iconMap, iconOptions } from "@/lib/iconMap";

interface IconPickerProps {
  name: string;
  defaultValue?: string;
}

export function IconPicker({ name, defaultValue = "Users" }: IconPickerProps) {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-6 gap-2">
        {iconOptions.map((iconName) => {
          const Icon = iconMap[iconName];
          const isActive = selected === iconName;
          return (
            <button
              key={iconName}
              type="button"
              title={iconName}
              onClick={() => setSelected(iconName)}
              className={`flex items-center justify-center aspect-square rounded-xl border transition cursor-pointer ${
                isActive
                  ? "bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-rose-500 text-red-600 dark:text-rose-400 ring-2 ring-red-200 dark:ring-rose-900/60"
                  : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-red-200 dark:hover:border-rose-800"
              }`}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
