"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ConfirmDialogTone = "default" | "danger";

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmDialogTone;
}

type ConfirmFn = (options: string | ConfirmOptions) => Promise<boolean>;

interface ConfirmRequest {
  options: Required<ConfirmOptions>;
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<ConfirmFn | null>(null);

function normalizeOptions(options: string | ConfirmOptions): Required<ConfirmOptions> {
  if (typeof options === "string") {
    return {
      title: "Confirm Action",
      message: options,
      confirmText: "Confirm",
      cancelText: "Cancel",
      tone: "default",
    };
  }
  return {
    title: options.title || "Confirm Action",
    message: options.message || "",
    confirmText: options.confirmText || "Confirm",
    cancelText: options.cancelText || "Cancel",
    tone: options.tone || "default",
  };
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const queueRef = useRef<ConfirmRequest[]>([]);
  const [current, setCurrent] = useState<ConfirmRequest | null>(null);

  const openNext = useCallback(() => {
    setCurrent((prev) => prev || queueRef.current.shift() || null);
  }, []);

  const confirm = useCallback<ConfirmFn>((rawOptions) => {
    return new Promise<boolean>((resolve) => {
      queueRef.current.push({
        options: normalizeOptions(rawOptions),
        resolve,
      });
      openNext();
    });
  }, [openNext]);

  const closeCurrent = useCallback((result: boolean) => {
    setCurrent((prev) => {
      if (prev) {
        prev.resolve(result);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!current) {
      openNext();
    }
  }, [current, openNext]);

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCurrent(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [current, closeCurrent]);

  const contextValue = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      {current && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700/60 bg-[#13131d] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-confirm-title"
          >
            <div className="border-b border-gray-700/50 px-6 py-4">
              <h3 id="global-confirm-title" className="text-lg font-semibold text-white">
                {current.options.title}
              </h3>
            </div>
            <div className="px-6 py-5">
              <p className="whitespace-pre-line text-sm leading-6 text-gray-300">
                {current.options.message}
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
              <button
                onClick={() => closeCurrent(false)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#1a1a2e] hover:text-white"
              >
                {current.options.cancelText}
              </button>
              <button
                onClick={() => closeCurrent(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  current.options.tone === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {current.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

