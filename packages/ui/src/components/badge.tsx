import React from "react";
import { cn } from "../utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "pending" | "approved" | "approved_pending_data" | "rejected" | "default";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    pending: "bg-amber-50 text-amber-800 border-amber-300",
    approved: "bg-emerald-50 text-emerald-800 border-emerald-300",
    approved_pending_data: "bg-amber-100 text-amber-900 border-amber-400 font-semibold",
    rejected: "bg-rose-50 text-rose-800 border-rose-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === "approved_pending_data" && <span className="mr-1">⚠</span>}
      {children}
    </div>
  );
}
