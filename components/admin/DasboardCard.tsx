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
    bg: "bg-red-50",
    icon: "bg-red-100",
    text: "text-red-700",
    iconColor: "text-red-700",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100",
    text: "text-blue-700",
    iconColor: "text-blue-700",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-100",
    text: "text-emerald-700",
    iconColor: "text-emerald-700",
  },
  yellow: {
    bg: "bg-amber-50",
    icon: "bg-amber-100",
    text: "text-amber-700",
    iconColor: "text-amber-700",
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
        "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 text-4xl font-bold text-gray-900">
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
            <p className="text-sm text-gray-500">
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