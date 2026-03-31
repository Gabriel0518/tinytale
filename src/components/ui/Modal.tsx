"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { useResponsiveModal } from "@/hooks/useResponsiveModal";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, className, size = "md" }: ModalProps) {
  const useMobileSheet = useResponsiveModal();

  useEffect(() => {
    if (useMobileSheet) return;

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, useMobileSheet]);

  if (!open) return null;

  if (useMobileSheet) {
    return (
      <MobileBottomSheet open={open} onClose={onClose} contentClassName={className}>
        {title ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/15 hover:text-white"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
        {children}
      </MobileBottomSheet>
    );
  }

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={cn(
        "relative w-full mx-4 rounded-xl bg-bg-secondary p-6",
        sizes[size],
        className
      )}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="text-text-tertiary hover:text-white transition-colors" aria-label="Close dialog">
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
