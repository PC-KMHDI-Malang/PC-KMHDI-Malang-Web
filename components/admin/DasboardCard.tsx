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
    bg: "bg-red-50",
    icon: "bg-red-100",
    text: "text-red-700",
    iconColor: "text-red-700",
  },
  green: {
    bg: "bg-black/5",
    icon: "bg-black",
    text: "text-black",
    iconColor: "text-white",
  },
  yellow: {
    bg: "bg-gray-100",
    icon: "bg-gray-200",
    text: "text-gray-800",
    iconColor: "text-gray-700",
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