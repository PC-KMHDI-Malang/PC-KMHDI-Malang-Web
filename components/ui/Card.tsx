import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "glass" | "outline";
  hover?: boolean;
  clickable?: boolean;
}

function Card({
  children,
  variant = "default",
  hover = true,
  clickable = false,
  className,
  ...props
}: CardProps) {
  const variants = {
    default:
      "bg-white border border-slate-200 shadow-lg",

    glass:
      "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-xl",

    outline:
      "bg-white border-2 border-red-100",
  };

  return (
    <div
      className={clsx(
        "rounded-3xl overflow-hidden transition-all duration-300",
        variants[variant],
        hover &&
          "hover:-translate-y-2 hover:shadow-2xl",
        clickable && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

function CardHeader({
  children,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={clsx(
        "p-6 pb-0",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

function CardContent({
  children,
  className,
}: CardContentProps) {
  return (
    <div
      className={clsx(
        "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

function CardFooter({
  children,
  className,
}: CardFooterProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between border-t border-slate-100 p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
};