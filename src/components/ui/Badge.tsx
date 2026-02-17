import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "gold" | "hot" | "new" | "vip" | "completed" | "ongoing" | "coming-soon";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-white/10 text-text-secondary",
    success: "bg-accent-success/20 text-accent-success",
    warning: "bg-accent-warning/20 text-accent-warning",
    error: "bg-accent-error/20 text-accent-error",
    gold: "bg-accent-gold/20 text-accent-gold",
    hot: "bg-red-600 text-white",
    new: "bg-blue-600 text-white",
    vip: "bg-gradient-to-r from-amber-500 to-yellow-600 text-black",
    completed: "bg-gray-600 text-white",
    ongoing: "bg-green-600 text-white",
    "coming-soon": "bg-purple-600 text-white",
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
