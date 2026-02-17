import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-text-secondary mb-1.5">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-lg border border-white/10 bg-bg-elevated px-4 py-2.5 pr-10 text-white",
              "focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary",
              "transition-colors duration-200",
              error && "border-accent-error",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-text-tertiary">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-accent-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
