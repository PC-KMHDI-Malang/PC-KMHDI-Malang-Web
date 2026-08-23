import { ReactNode } from "react";
import clsx from "clsx";

import Badge from "./Badge";

interface SectionTitleProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
}

export default function SectionTitle({
  badge,
  title,
  description,
  align = "center",
  action,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={clsx(
        "mb-16",
        align === "center"
          ? "mx-auto max-w-3xl text-center"
          : "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div
        className={clsx(
          align === "left"
            ? "max-w-3xl"
            : ""
        )}
      >
        {badge && (
          <Badge>
            {badge}
          </Badge>
        )}

        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}