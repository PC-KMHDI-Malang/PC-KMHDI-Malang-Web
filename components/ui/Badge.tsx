import { ReactNode } from "react";
import clsx from "clsx";

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "glass";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Badge({
  children,
  variant = "primary",
  size = "md",
  className,
}: BadgeProps) {
  const variants = {
    primary:
      "bg-red-100 text-red-700 border border-red-200",

    secondary:
      "bg-slate-100 text-slate-700 border border-slate-200",

    outline:
      "bg-transparent border border-red-600 text-red-700",

    glass:
      "bg-white/10 backdrop-blur-xl border border-white/20 text-white",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",

    md: "px-4 py-2 text-sm",

    lg: "px-5 py-2.5 text-base",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}