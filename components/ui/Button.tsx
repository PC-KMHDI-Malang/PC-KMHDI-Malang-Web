import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-red-700 text-white hover:bg-red-800 shadow-lg hover:shadow-xl",

    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200",

    outline:
      "border border-red-700 text-red-700 hover:bg-red-700 hover:text-white",

    ghost:
      "text-red-700 hover:bg-red-50",

    glass:
      "border border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20",
  };

  const sizes = {
    sm: "h-10 px-4 text-sm",

    md: "h-12 px-6 text-base",

    lg: "h-14 px-8 text-lg",
  };

  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300",
    "hover:-translate-y-0.5 active:translate-y-0",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {loading ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : (
        leftIcon
      )}

      <span>{children}</span>

      {!loading && rightIcon}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
}