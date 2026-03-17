"use client";

import { useAdminLocale } from "@/lib/admin-i18n";

export default function AdminLanguageSwitcher() {
  const { locale, setLocale } = useAdminLocale();

  return (
    <div
      className="flex items-center rounded-lg border border-gray-700/70 bg-[#0f0f17]/90 p-1"
      role="group"
      aria-label={locale === "zh" ? "切换后台语言" : "Switch admin language"}
    >
      <button
        type="button"
        onClick={() => setLocale("zh")}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
          locale === "zh"
            ? "bg-indigo-600 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
        aria-pressed={locale === "zh"}
      >
        中
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
          locale === "en"
            ? "bg-indigo-600 text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}

