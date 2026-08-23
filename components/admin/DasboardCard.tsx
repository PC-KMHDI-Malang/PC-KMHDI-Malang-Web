import { LucideIcon, TrendingUp } from "lucide-react";
import clsx from "clsx";

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  color?: "red" | "blue" | "green" | "yellow";
}

const colors = {
  red: {
    bg: "bg-red-50 dark:bg-rose-950/30",
    icon: "bg-red-100 dark:bg-rose-900/50",
    text: "text-red-700 dark:text-rose-400",
    iconColor: "text-red-700 dark:text-rose-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-700 dark:text-blue-400",
  },
  green: {
    bg: "bg-black/5 dark:bg-white/5",
    icon: "bg-black dark:bg-white",
    text: "text-black dark:text-white",
    iconColor: "text-white dark:text-black",
  },
  yellow: {
    bg: "bg-gray-100 dark:bg-yellow-950/30",
    icon: "bg-gray-200 dark:bg-yellow-900/50",
    text: "text-gray-800 dark:text-yellow-400",
    iconColor: "text-gray-700 dark:text-yellow-400",
  },
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "red",
}: DashboardCardProps) {
  const theme = colors[color];

  return (
    <div
      className={clsx(
        "rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-none transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/50"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h2 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
            {value}
          </h2>
        </div>

        <div
          className={clsx(
            "rounded-xl p-3",
            theme.icon
          )}
        >
          <Icon
            size={24}
            className={theme.iconColor}
          />
        </div>
      </div>

      {(description || trend !== undefined) && (
        <div className="mt-6 flex items-center justify-between">
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}

          {trend !== undefined && (
            <div
              className={clsx(
                "flex items-center gap-1 text-sm font-semibold",
                theme.text
              )}
            >
              <TrendingUp size={16} />
              {trend}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}