"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  variant?: "primary" | "destructive" | "outline";
}

export function SubmitButton({
  children,
  loadingText = "Memproses...",
  className = "",
  variant = "primary",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  let baseStyle = "";
  if (variant === "primary") {
    baseStyle = "bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30";
  } else if (variant === "destructive") {
    baseStyle = "bg-red-600 dark:bg-rose-600 text-white hover:bg-red-700 dark:hover:bg-rose-700 hover:shadow-lg hover:shadow-red-600/30";
  } else if (variant === "outline") {
    baseStyle = "bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800";
  }

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      className={`relative inline-flex items-center justify-center font-bold px-8 py-3 rounded-xl transition-all duration-300 ${baseStyle} ${
        pending ? "opacity-80 cursor-not-allowed" : ""
      } ${className}`}
    >
      {pending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {pending ? loadingText : children}
    </button>
  );
}