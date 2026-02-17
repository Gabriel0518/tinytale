import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-text-secondary mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-2.5 text-white",
              "placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary",
              "transition-colors duration-200",
              icon && "pl-10",
              error && "border-accent-error focus:border-accent-error focus:ring-accent-error",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-accent-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
