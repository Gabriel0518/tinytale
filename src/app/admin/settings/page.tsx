"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";

/* ───────── types ───────── */
interface RechargeTier {
  id: number;
  amount: number;
  coins: number;
  bonus: number;
  label: string;
  status: "active" | "hidden";
}

interface VipPlan {
  _id?: string;
  name: string;
  price: number;
  durationDays: number;
  status: "active" | "inactive";
}

interface VipPrivileges {
  adFree: boolean;
  highQuality: boolean;
  earlyAccess: boolean;
  coinDiscount: number;
  freeMonthlyDramas: number;
  overLimitDiscount: number;
  termsUrl: string;
}

type TabKey = "recharge" | "vip" | "playback" | "promotion" | "email" | "payment" | "social";

const CONFIG_GROUPS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  {
    key: "recharge",
    label: "Recharge",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeWidth={1.5} d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.66 0-3 1-3 2.25S10.34 12.5 12 12.5s3 1 3 2.25S13.66 16.25 12 16.25c-1 0-2-.5-2.5-1.5M12 7v1.5m0 7.5v1.5" />
      </svg>
    ),
  },
  {
    key: "vip",
    label: "Member / VIP",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    key: "playback",
    label: "Playback",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    key: "promotion",
    label: "Promotion",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 01-1.021-.27 18.634 18.634 0 01-2.064-5.674m3.22-5.73A18.565 18.565 0 0114.07 3.48a.75.75 0 011.02-.27l.658.38c.523.302.71.962.463 1.511a18.634 18.634 0 00-.985 2.783m-3.22 5.73a18.835 18.835 0 003.22-5.73m0 0A18.478 18.478 0 0118 9.75M21.75 12a2.25 2.25 0 01-2.25 2.25h-.75" />
      </svg>
    ),
  },
  {
    key: "email",
    label: "Email / SMTP",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    key: "payment",
    label: "Payment API",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    key: "social",
    label: "Social Accounts",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.777.514-3.434 1.4-4.832" />
      </svg>
    ),
  },
];

/* ───────── reusable sub-components ───────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? "bg-indigo-600" : "bg-gray-600"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-gray-300">{children}</label>;
}

function TextInput({ value, onChange, type = "text", placeholder, icon, showToggle }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  showToggle?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const inputType = showToggle ? (visible ? "text" : "password") : type;
  return (
    <div className="relative">
      {icon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>}
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${icon ? "pl-10" : ""} ${showToggle ? "pr-10" : ""}`}
      />
      {showToggle && (
        <button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
          {visible ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          )}
        </button>
      )}
    </div>
  );
}

function NumberInput({ value, onChange, suffix, placeholder }: { value: number; onChange: (v: number) => void; suffix?: string; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{suffix}</span>}
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition">
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-[#252540] transition">
      {children}
    </button>
  );
}

function KeyIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
}

function LockIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("recharge");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Recharge state ── */
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [firstTimeDouble, setFirstTimeDouble] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(100);
  const [termsUrl, setTermsUrl] = useState("");
  const [tiers, setTiers] = useState<RechargeTier[]>([]);
  const [editingTier, setEditingTier] = useState<RechargeTier | null>(null);

  /* ── VIP state ── */
  const [vipPlans, setVipPlans] = useState<VipPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<VipPlan | null>(null);
  const [vipPrivileges, setVipPrivileges] = useState<VipPrivileges>({
    adFree: true, highQuality: true, earlyAccess: false, coinDiscount: 10, freeMonthlyDramas: 30, overLimitDiscount: 50, termsUrl: "",
  });

  /* ── Playback state ── */
  const [videoQuality, setVideoQuality] = useState("720p");
  const [autoPlay, setAutoPlay] = useState(true);
  const [previewDuration, setPreviewDuration] = useState(30);
  const [cdnProvider, setCdnProvider] = useState("cloudflare");

  /* ── Promotion state ── */
  const [commissionRate, setCommissionRate] = useState(10);
  const [minWithdrawal, setMinWithdrawal] = useState(50);
  const [withdrawalDays, setWithdrawalDays] = useState(7);

  /* ── Email state ── */
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [enableSsl, setEnableSsl] = useState(true);

  /* ── Payment state ── */
  const [stripeTestMode, setStripeTestMode] = useState(true);
  const [stripePk, setStripePk] = useState("");
  const [stripeSk, setStripeSk] = useState("");
  const [stripeWebhook, setStripeWebhook] = useState("");
  const [airwallexLive, setAirwallexLive] = useState(false);
  const [airwallexClientId, setAirwallexClientId] = useState("");
  const [airwallexApiKey, setAirwallexApiKey] = useState("");
  const [airwallexWebhook, setAirwallexWebhook] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [paymentLocale, setPaymentLocale] = useState("auto");
  const [enable3ds, setEnable3ds] = useState(true);

  /* ── Social state ── */
  const [socialWhatsapp, setSocialWhatsapp] = useState("");
  const [socialTelegram, setSocialTelegram] = useState("");
  const [socialDiscord, setSocialDiscord] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");

  /* ── toast helper ── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* ── load settings for a category ── */
  const loadSettings = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const res: any = await adminApi.getSettings(category);

      const settings: { key: string; value: any }[] = res?.data?.settings || res?.data || [];
      const map = new Map(settings.map((s) => [s.key, s.value]));

      if (category === "recharge") {
        if (map.has("maintenance_mode")) setMaintenanceMode(map.get("maintenance_mode") === "true" || map.get("maintenance_mode") === true);
        if (map.has("first_time_double")) setFirstTimeDouble(map.get("first_time_double") === "true" || map.get("first_time_double") === true);
        if (map.has("base_currency")) setBaseCurrency(map.get("base_currency") as string);
        if (map.has("exchange_rate")) setExchangeRate(Number(map.get("exchange_rate")));
        if (map.has("terms_url")) setTermsUrl(map.get("terms_url") as string);
        if (map.has("recharge_tiers")) {
          try { setTiers(typeof map.get("recharge_tiers") === "string" ? JSON.parse(map.get("recharge_tiers")) : map.get("recharge_tiers")); } catch {}
        }
      } else if (category === "vip") {
        if (map.has("vip_privileges")) {
          try { setVipPrivileges(typeof map.get("vip_privileges") === "string" ? JSON.parse(map.get("vip_privileges")) : map.get("vip_privileges")); } catch {}
        }
      } else if (category === "playback") {
        if (map.has("video_quality")) setVideoQuality(map.get("video_quality") as string);
        if (map.has("auto_play")) setAutoPlay(map.get("auto_play") === "true" || map.get("auto_play") === true);
        if (map.has("preview_duration")) setPreviewDuration(Number(map.get("preview_duration")));
        if (map.has("cdn_provider")) setCdnProvider(map.get("cdn_provider") as string);
      } else if (category === "promotion") {
        if (map.has("commission_rate")) setCommissionRate(Number(map.get("commission_rate")));
        if (map.has("min_withdrawal")) setMinWithdrawal(Number(map.get("min_withdrawal")));
        if (map.has("withdrawal_days")) setWithdrawalDays(Number(map.get("withdrawal_days")));
      } else if (category === "email") {
        if (map.has("smtp_host")) setSmtpHost(map.get("smtp_host") as string);
        if (map.has("smtp_port")) setSmtpPort(map.get("smtp_port") as string);
        if (map.has("smtp_user")) setSmtpUser(map.get("smtp_user") as string);
        if (map.has("smtp_pass")) setSmtpPass(map.get("smtp_pass") as string);
        if (map.has("from_email")) setFromEmail(map.get("from_email") as string);
        if (map.has("from_name")) setFromName(map.get("from_name") as string);
        if (map.has("enable_ssl")) setEnableSsl(map.get("enable_ssl") === "true" || map.get("enable_ssl") === true);
      } else if (category === "payment") {
        if (map.has("stripe_test_mode")) setStripeTestMode(map.get("stripe_test_mode") === "true" || map.get("stripe_test_mode") === true);
        if (map.has("stripe_pk")) setStripePk(map.get("stripe_pk") as string);
        if (map.has("stripe_sk")) setStripeSk(map.get("stripe_sk") as string);
        if (map.has("stripe_webhook")) setStripeWebhook(map.get("stripe_webhook") as string);
        if (map.has("airwallex_live")) setAirwallexLive(map.get("airwallex_live") === "true" || map.get("airwallex_live") === true);
        if (map.has("airwallex_client_id")) setAirwallexClientId(map.get("airwallex_client_id") as string);
        if (map.has("airwallex_api_key")) setAirwallexApiKey(map.get("airwallex_api_key") as string);
        if (map.has("airwallex_webhook")) setAirwallexWebhook(map.get("airwallex_webhook") as string);
        if (map.has("default_currency")) setDefaultCurrency(map.get("default_currency") as string);
        if (map.has("payment_locale")) setPaymentLocale(map.get("payment_locale") as string);
        if (map.has("enable_3ds")) setEnable3ds(map.get("enable_3ds") === "true" || map.get("enable_3ds") === true);
      } else if (category === "social") {
        if (map.has("social_whatsapp")) setSocialWhatsapp(map.get("social_whatsapp") as string);
        if (map.has("social_telegram")) setSocialTelegram(map.get("social_telegram") as string);
        if (map.has("social_discord")) setSocialDiscord(map.get("social_discord") as string);
        if (map.has("social_x")) setSocialX(map.get("social_x") as string);
        if (map.has("social_instagram")) setSocialInstagram(map.get("social_instagram") as string);
        if (map.has("social_youtube")) setSocialYoutube(map.get("social_youtube") as string);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── load VIP plans ── */
  const loadVipPlans = useCallback(async () => {
    try {
      const res: any = await adminApi.getVipPlans();
      if (res?.data) setVipPlans(Array.isArray(res.data) ? res.data : res.data.plans || []);
    } catch {}
  }, []);

  /* ── save settings helper ── */
  const saveSettings = async (settingsArr: { key: string; value: any; category: string }[]) => {
    setSaving(true);
    try {
      await adminApi.saveSettings(settingsArr);
      showToast("Settings saved successfully");
    } catch {
      showToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* ── load on tab change ── */
  useEffect(() => {
    loadSettings(activeTab);
    if (activeTab === "vip") loadVipPlans();
  }, [activeTab, loadSettings, loadVipPlans]);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#0f0f17] p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">System Settings</h1>
          <p className="mt-1 text-sm text-gray-400">Global Parameters</p>
        </div>
        <Link
          href="/admin/settings/help-center"
          className="rounded-lg border border-indigo-500/40 bg-indigo-600/10 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-600/20"
        >
          Information &amp; Help Center
        </Link>
      </div>

      <div className="flex gap-6">
        {/* ── Left Sidebar ── */}
        <div className="w-60 shrink-0">
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-3">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Config Groups</p>
            <nav className="space-y-1">
              {CONFIG_GROUPS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setActiveTab(g.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    activeTab === g.key
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
                  }`}
                >
                  {g.icon}
                  <span className="flex-1 text-left">{g.label}</span>
                  {activeTab === g.key && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Right Content ── */}
        <div className="min-w-0 flex-1 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          )}

          {!loading && activeTab === "recharge" && renderRecharge()}
          {!loading && activeTab === "vip" && renderVip()}
          {!loading && activeTab === "playback" && renderPlayback()}
          {!loading && activeTab === "promotion" && renderPromotion()}
          {!loading && activeTab === "email" && renderEmail()}
          {!loading && activeTab === "payment" && renderPayment()}
          {!loading && activeTab === "social" && renderSocial()}
        </div>
      </div>
    </div>
  );

  /* ───────── Tab 1: Recharge ───────── */
  function renderRecharge() {
    const handleSaveRules = () =>
      saveSettings([
        { key: "maintenance_mode", value: maintenanceMode, category: "recharge" },
        { key: "first_time_double", value: firstTimeDouble, category: "recharge" },
        { key: "base_currency", value: baseCurrency, category: "recharge" },
        { key: "exchange_rate", value: exchangeRate, category: "recharge" },
        { key: "terms_url", value: termsUrl, category: "recharge" },
      ]);

    const handleSaveTiers = () =>
      saveSettings([{ key: "recharge_tiers", value: JSON.stringify(tiers), category: "recharge" }]);

    const addTier = () =>
      setTiers([...tiers, { id: tiers.length + 1, amount: 0, coins: 0, bonus: 0, label: "", status: "active" }]);

    const removeTier = (id: number) => setTiers(tiers.filter((t) => t.id !== id));

    const handleEditTier = (tier: RechargeTier) => setEditingTier({ ...tier });

    const handleSaveEdit = () => {
      if (!editingTier) return;
      setTiers(tiers.map((t) => (t.id === editingTier.id ? editingTier : t)));
      setEditingTier(null);
    };

    return (
      <>
        <SectionCard
          title="General Recharge Rules"
          action={<PrimaryBtn onClick={handleSaveRules} disabled={saving}>{saving ? "Saving..." : "Save Rules"}</PrimaryBtn>}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg bg-[#1a1a2e] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-200">System Maintenance Mode</p>
                <p className="text-xs text-gray-500">Suspend all recharge activities temporarily</p>
              </div>
              <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#1a1a2e] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-200">First-Time Double Bonus</p>
                <p className="text-xs text-gray-500">Apply 2x multiplier for new user first deposit</p>
              </div>
              <Toggle checked={firstTimeDouble} onChange={setFirstTimeDouble} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Base Currency</FieldLabel>
                <SelectInput value={baseCurrency} onChange={setBaseCurrency} options={[
                  { value: "USD", label: "USD - US Dollar" },
                  { value: "EUR", label: "EUR - Euro" },
                  { value: "GBP", label: "GBP - British Pound" },
                  { value: "CNY", label: "CNY - Chinese Yuan" },
                ]} />
              </div>
              <div>
                <FieldLabel>Exchange Rate (Coins per 1 Unit)</FieldLabel>
                <NumberInput value={exchangeRate} onChange={setExchangeRate} />
              </div>
            </div>
            <div>
              <FieldLabel>Terms &amp; Policy URL</FieldLabel>
              <TextInput value={termsUrl} onChange={setTermsUrl} placeholder="https://example.com/terms" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Recharge Tiers"
          action={
            <button onClick={addTier} className="flex items-center gap-1.5 rounded-lg bg-indigo-600/10 px-3 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-600/20 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add New Tier
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Amount (USD)</th>
                  <th className="pb-3 pr-4">Coins</th>
                  <th className="pb-3 pr-4">Bonus Coins</th>
                  <th className="pb-3 pr-4">Label</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {tiers.map((tier) => (
                  <tr key={tier.id} className="text-gray-300">
                    <td className="py-3 pr-4 text-gray-500">{tier.id}</td>
                    <td className="py-3 pr-4">${tier.amount.toFixed(2)}</td>
                    <td className="py-3 pr-4">{tier.coins}</td>
                    <td className="py-3 pr-4">+{tier.bonus}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tier.label === "Popular" ? "bg-indigo-500/20 text-indigo-400" :
                        tier.label === "Best Value" ? "bg-emerald-500/20 text-emerald-400" :
                        "bg-gray-700/50 text-gray-400"
                      }`}>{tier.label}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tier.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700/50 text-gray-500"
                      }`}>{tier.status === "active" ? "Active" : "Hidden"}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditTier(tier)} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                        <button onClick={() => removeTier(tier.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <PrimaryBtn onClick={handleSaveTiers} disabled={saving}>{saving ? "Saving..." : "Save Tiers"}</PrimaryBtn>
          </div>
        </SectionCard>

        {/* Edit Tier Modal */}
        {editingTier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-gray-700/50 bg-[#13131d] p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-200 mb-5">Edit Tier #{editingTier.id}</h3>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Amount (USD)</FieldLabel>
                  <NumberInput value={editingTier.amount} onChange={(v) => setEditingTier({ ...editingTier, amount: v })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Coins</FieldLabel>
                    <NumberInput value={editingTier.coins} onChange={(v) => setEditingTier({ ...editingTier, coins: v })} />
                  </div>
                  <div>
                    <FieldLabel>Bonus Coins</FieldLabel>
                    <NumberInput value={editingTier.bonus} onChange={(v) => setEditingTier({ ...editingTier, bonus: v })} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Label</FieldLabel>
                  <TextInput value={editingTier.label} onChange={(v) => setEditingTier({ ...editingTier, label: v })} placeholder="e.g. Popular, Best Value" />
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <SelectInput value={editingTier.status} onChange={(v) => setEditingTier({ ...editingTier, status: v as "active" | "hidden" })} options={[
                    { value: "active", label: "Active" },
                    { value: "hidden", label: "Hidden" },
                  ]} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <SecondaryBtn onClick={() => setEditingTier(null)}>Cancel</SecondaryBtn>
                <PrimaryBtn onClick={handleSaveEdit}>Save Changes</PrimaryBtn>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ───────── Tab 2: Member / VIP ───────── */
  function renderVip() {
    const addPlan = async () => {
      try {
        await adminApi.createVipPlan({ name: "New Plan", price: 9.99, durationDays: 30, status: "inactive" });
        loadVipPlans();
        showToast("Plan added");
      } catch { showToast("Failed to add plan"); }
    };

    const deletePlan = async (id: string) => {
      try {
        await adminApi.deleteVipPlan(id);
        loadVipPlans();
        showToast("Plan deleted");
      } catch { showToast("Failed to delete plan"); }
    };

    const handleEditPlan = (plan: VipPlan) => setEditingPlan({ ...plan });

    const handleSaveEditPlan = async () => {
      if (!editingPlan || !editingPlan._id) return;
      try {
        await adminApi.updateVipPlan(editingPlan._id, {
          name: editingPlan.name,
          price: editingPlan.price,
          durationDays: editingPlan.durationDays,
          status: editingPlan.status,
        });
        loadVipPlans();
        setEditingPlan(null);
        showToast("Plan updated");
      } catch { showToast("Failed to update plan"); }
    };

    const handleSavePerks = () =>
      saveSettings([{ key: "vip_privileges", value: JSON.stringify(vipPrivileges), category: "vip" }]);

    return (
      <>
        <SectionCard
          title="Subscription Plans"
          action={
            <button onClick={addPlan} className="flex items-center gap-1.5 rounded-lg bg-indigo-600/10 px-3 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-600/20 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add New Plan
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Plan Name</th>
                  <th className="pb-3 pr-4">Price</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {vipPlans.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No plans configured yet</td></tr>
                )}
                {vipPlans.map((plan, i) => (
                  <tr key={plan._id || i} className="text-gray-300">
                    <td className="py-3 pr-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{plan.name}</td>
                    <td className="py-3 pr-4">${plan.price}</td>
                    <td className="py-3 pr-4">{plan.durationDays} days</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        plan.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700/50 text-gray-500"
                      }`}>{plan.status === "active" ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditPlan(plan)} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                        <button onClick={() => plan._id && deletePlan(plan._id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="VIP Privileges"
          action={<PrimaryBtn onClick={handleSavePerks} disabled={saving}>{saving ? "Saving..." : "Save Perks"}</PrimaryBtn>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ad-free */}
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">Ad-free Experience</p>
                <Toggle checked={vipPrivileges.adFree} onChange={(v) => setVipPrivileges({ ...vipPrivileges, adFree: v })} />
              </div>
              <p className="mt-1 text-xs text-gray-500">Disable all in-app advertisements.</p>
            </div>
            {/* High-Quality */}
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">High-Quality Video</p>
                <Toggle checked={vipPrivileges.highQuality} onChange={(v) => setVipPrivileges({ ...vipPrivileges, highQuality: v })} />
              </div>
              <p className="mt-1 text-xs text-gray-500">Allow 1080p and 4K playback options.</p>
            </div>
            {/* Early Access */}
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">Early Access</p>
                <Toggle checked={vipPrivileges.earlyAccess} onChange={(v) => setVipPrivileges({ ...vipPrivileges, earlyAccess: v })} />
              </div>
              <p className="mt-1 text-xs text-gray-500">View content before public release.</p>
            </div>
            {/* Coin Discount */}
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
              <p className="text-sm font-medium text-gray-200">Coin Purchase Discount</p>
              <p className="mt-1 text-xs text-gray-500">Percentage discount on store items.</p>
              <div className="mt-3">
                <NumberInput value={vipPrivileges.coinDiscount} onChange={(v) => setVipPrivileges({ ...vipPrivileges, coinDiscount: v })} suffix="%" />
              </div>
            </div>
            {/* Monthly Free Dramas */}
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
              <p className="text-sm font-medium text-gray-200">Monthly Free Dramas</p>
              <p className="mt-1 text-xs text-gray-500">Number of dramas VIP members can watch for free each month.</p>
              <div className="mt-3">
                <NumberInput value={vipPrivileges.freeMonthlyDramas} onChange={(v) => setVipPrivileges({ ...vipPrivileges, freeMonthlyDramas: v })} suffix="dramas" />
              </div>
            </div>
            {/* Over-Limit Discount */}
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-4">
              <p className="text-sm font-medium text-gray-200">Over-Limit Discount</p>
              <p className="mt-1 text-xs text-gray-500">VIP discount on episodes beyond the free monthly limit (% of normal price).</p>
              <div className="mt-3">
                <NumberInput value={vipPrivileges.overLimitDiscount} onChange={(v) => setVipPrivileges({ ...vipPrivileges, overLimitDiscount: v })} suffix="%" />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <FieldLabel>VIP Terms of Service URL</FieldLabel>
            <TextInput value={vipPrivileges.termsUrl} onChange={(v) => setVipPrivileges({ ...vipPrivileges, termsUrl: v })} placeholder="https://example.com/vip-terms" />
          </div>
        </SectionCard>

        {/* Edit Plan Modal */}
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-gray-700/50 bg-[#13131d] p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-200 mb-5">Edit Plan</h3>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Plan Name</FieldLabel>
                  <TextInput value={editingPlan.name} onChange={(v) => setEditingPlan({ ...editingPlan, name: v })} placeholder="e.g. Monthly, Quarterly" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Price (USD)</FieldLabel>
                    <NumberInput value={editingPlan.price} onChange={(v) => setEditingPlan({ ...editingPlan, price: v })} />
                  </div>
                  <div>
                    <FieldLabel>Duration (Days)</FieldLabel>
                    <NumberInput value={editingPlan.durationDays} onChange={(v) => setEditingPlan({ ...editingPlan, durationDays: v })} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <SelectInput value={editingPlan.status} onChange={(v) => setEditingPlan({ ...editingPlan, status: v as "active" | "inactive" })} options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <SecondaryBtn onClick={() => setEditingPlan(null)}>Cancel</SecondaryBtn>
                <PrimaryBtn onClick={handleSaveEditPlan}>Save Changes</PrimaryBtn>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ───────── Tab 3: Playback ───────── */
  function renderPlayback() {
    const handleSave = () =>
      saveSettings([
        { key: "video_quality", value: videoQuality, category: "playback" },
        { key: "auto_play", value: autoPlay, category: "playback" },
        { key: "preview_duration", value: previewDuration, category: "playback" },
        { key: "cdn_provider", value: cdnProvider, category: "playback" },
      ]);

    return (
      <SectionCard
        title="Playback Settings"
        action={<PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</PrimaryBtn>}
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Video Quality Default</FieldLabel>
              <SelectInput value={videoQuality} onChange={setVideoQuality} options={[
                { value: "720p", label: "720p" },
                { value: "1080p", label: "1080p" },
                { value: "4k", label: "4K" },
              ]} />
            </div>
            <div>
              <FieldLabel>CDN Provider</FieldLabel>
              <SelectInput value={cdnProvider} onChange={setCdnProvider} options={[
                { value: "cloudflare", label: "Cloudflare Stream" },
                { value: "mux", label: "Mux" },
                { value: "aws", label: "AWS CloudFront" },
                { value: "bunny", label: "Bunny CDN" },
              ]} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#1a1a2e] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-200">Auto-play Next Episode</p>
              <p className="text-xs text-gray-500">Automatically play the next episode when current one ends</p>
            </div>
            <Toggle checked={autoPlay} onChange={setAutoPlay} />
          </div>
          <div>
            <FieldLabel>Preview Duration for Locked Episodes (seconds)</FieldLabel>
            <NumberInput value={previewDuration} onChange={setPreviewDuration} suffix="sec" />
          </div>
        </div>
      </SectionCard>
    );
  }

  /* ───────── Tab 4: Promotion ───────── */
  function renderPromotion() {
    const handleSave = () =>
      saveSettings([
        { key: "commission_rate", value: commissionRate, category: "promotion" },
        { key: "min_withdrawal", value: minWithdrawal, category: "promotion" },
        { key: "withdrawal_days", value: withdrawalDays, category: "promotion" },
      ]);

    return (
      <SectionCard
        title="Promotion Settings"
        action={<PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</PrimaryBtn>}
      >
        <div className="space-y-5">
          <div>
            <FieldLabel>Default Commission Rate</FieldLabel>
            <NumberInput value={commissionRate} onChange={setCommissionRate} suffix="%" />
          </div>
          <div>
            <FieldLabel>Minimum Withdrawal Amount</FieldLabel>
            <NumberInput value={minWithdrawal} onChange={setMinWithdrawal} suffix="USD" />
          </div>
          <div>
            <FieldLabel>Withdrawal Processing Days</FieldLabel>
            <NumberInput value={withdrawalDays} onChange={setWithdrawalDays} suffix="days" />
          </div>
        </div>
      </SectionCard>
    );
  }

  /* ───────── Tab 5: Email / SMTP ───────── */
  function renderEmail() {
    const handleSave = () =>
      saveSettings([
        { key: "smtp_host", value: smtpHost, category: "email" },
        { key: "smtp_port", value: smtpPort, category: "email" },
        { key: "smtp_user", value: smtpUser, category: "email" },
        { key: "smtp_pass", value: smtpPass, category: "email" },
        { key: "from_email", value: fromEmail, category: "email" },
        { key: "from_name", value: fromName, category: "email" },
        { key: "enable_ssl", value: enableSsl, category: "email" },
      ]);

    const handleTestEmail = () => showToast("Test email sent (mock)");

    return (
      <SectionCard
        title="Email / SMTP Configuration"
        action={<PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</PrimaryBtn>}
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>SMTP Host</FieldLabel>
              <TextInput value={smtpHost} onChange={setSmtpHost} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <FieldLabel>SMTP Port</FieldLabel>
              <TextInput value={smtpPort} onChange={setSmtpPort} placeholder="587" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Username</FieldLabel>
              <TextInput value={smtpUser} onChange={setSmtpUser} placeholder="user@example.com" />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <TextInput value={smtpPass} onChange={setSmtpPass} type="password" placeholder="••••••••" showToggle />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>From Email</FieldLabel>
              <TextInput value={fromEmail} onChange={setFromEmail} placeholder="noreply@tinytale.com" />
            </div>
            <div>
              <FieldLabel>From Name</FieldLabel>
              <TextInput value={fromName} onChange={setFromName} placeholder="TinyTale" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#1a1a2e] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-200">Enable SSL</p>
              <p className="text-xs text-gray-500">Use SSL/TLS for SMTP connection</p>
            </div>
            <Toggle checked={enableSsl} onChange={setEnableSsl} />
          </div>
          <div className="flex justify-end">
            <SecondaryBtn onClick={handleTestEmail}>Send Test Email</SecondaryBtn>
          </div>
        </div>
      </SectionCard>
    );
  }

  /* ───────── Tab 6: Payment API ───────── */
  function renderPayment() {
    const handleSaveStripe = () =>
      saveSettings([
        { key: "stripe_test_mode", value: stripeTestMode, category: "payment" },
        { key: "stripe_pk", value: stripePk, category: "payment" },
        { key: "stripe_sk", value: stripeSk, category: "payment" },
        { key: "stripe_webhook", value: stripeWebhook, category: "payment" },
      ]);

    const handleSaveAirwallex = () =>
      saveSettings([
        { key: "airwallex_live", value: airwallexLive, category: "payment" },
        { key: "airwallex_client_id", value: airwallexClientId, category: "payment" },
        { key: "airwallex_api_key", value: airwallexApiKey, category: "payment" },
        { key: "airwallex_webhook", value: airwallexWebhook, category: "payment" },
      ]);

    const handleSaveLocalization = () =>
      saveSettings([
        { key: "default_currency", value: defaultCurrency, category: "payment" },
        { key: "payment_locale", value: paymentLocale, category: "payment" },
        { key: "enable_3ds", value: enable3ds, category: "payment" },
      ]);

    return (
      <>
        {/* Stripe */}
        <SectionCard
          title="Stripe Payments"
          action={
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Test Mode</span>
              <Toggle checked={stripeTestMode} onChange={setStripeTestMode} />
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <FieldLabel>Publishable API Key</FieldLabel>
              <TextInput value={stripePk} onChange={setStripePk} placeholder="pk_live_..." icon={<KeyIcon />} />
            </div>
            <div>
              <FieldLabel>Secret Key</FieldLabel>
              <TextInput value={stripeSk} onChange={setStripeSk} placeholder="sk_live_..." icon={<LockIcon />} showToggle />
            </div>
            <div>
              <FieldLabel>Webhook Signing Secret</FieldLabel>
              <TextInput value={stripeWebhook} onChange={setStripeWebhook} placeholder="whsec_..." icon={<LockIcon />} showToggle />
            </div>
            <div className="flex justify-end">
              <PrimaryBtn onClick={handleSaveStripe} disabled={saving}>{saving ? "Saving..." : "Save Stripe Config"}</PrimaryBtn>
            </div>
          </div>
        </SectionCard>

        {/* Airwallex */}
        <SectionCard
          title="Airwallex"
          action={
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Live Mode</span>
              <Toggle checked={airwallexLive} onChange={setAirwallexLive} />
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <FieldLabel>Client ID</FieldLabel>
              <TextInput value={airwallexClientId} onChange={setAirwallexClientId} placeholder="Enter Client ID" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>API Key</FieldLabel>
                <TextInput value={airwallexApiKey} onChange={setAirwallexApiKey} placeholder="Enter API Key" showToggle />
              </div>
              <div>
                <FieldLabel>Webhook Secret</FieldLabel>
                <TextInput value={airwallexWebhook} onChange={setAirwallexWebhook} placeholder="Enter Webhook Secret" showToggle />
              </div>
            </div>
            <div className="flex justify-end">
              <PrimaryBtn onClick={handleSaveAirwallex} disabled={saving}>{saving ? "Saving..." : "Save Airwallex Config"}</PrimaryBtn>
            </div>
          </div>
        </SectionCard>

        {/* Payment Localization */}
        <SectionCard title="Payment Localization">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Default Currency</FieldLabel>
                <SelectInput value={defaultCurrency} onChange={setDefaultCurrency} options={[
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (\u20ac)" },
                  { value: "GBP", label: "GBP (\u00a3)" },
                  { value: "CNY", label: "CNY (\u00a5)" },
                ]} />
              </div>
              <div>
                <FieldLabel>Payment Page Locale</FieldLabel>
                <SelectInput value={paymentLocale} onChange={setPaymentLocale} options={[
                  { value: "auto", label: "Auto-detect" },
                  { value: "en", label: "English" },
                  { value: "zh", label: "Chinese" },
                  { value: "es", label: "Spanish" },
                ]} />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#1a1a2e] px-4 py-3">
              <input
                type="checkbox"
                checked={enable3ds}
                onChange={(e) => setEnable3ds(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-[#1a1a2e] text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-200">Enable 3D Secure</p>
                <p className="text-xs text-gray-500">Require 3D Secure authentication for card payments</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <SecondaryBtn onClick={() => { setDefaultCurrency("USD"); setPaymentLocale("auto"); setEnable3ds(true); }}>Cancel</SecondaryBtn>
              <PrimaryBtn onClick={handleSaveLocalization} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</PrimaryBtn>
            </div>
          </div>
        </SectionCard>
      </>
    );
  }

  /* ───────── Tab 7: Social Accounts ───────── */
  function renderSocial() {
    const handleSave = () =>
      saveSettings([
        { key: "social_whatsapp", value: socialWhatsapp, category: "social" },
        { key: "social_telegram", value: socialTelegram, category: "social" },
        { key: "social_discord", value: socialDiscord, category: "social" },
        { key: "social_x", value: socialX, category: "social" },
        { key: "social_instagram", value: socialInstagram, category: "social" },
        { key: "social_youtube", value: socialYoutube, category: "social" },
      ]);

    return (
      <SectionCard
        title="Social Accounts"
        action={<PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</PrimaryBtn>}
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>WhatsApp</FieldLabel>
              <TextInput value={socialWhatsapp} onChange={setSocialWhatsapp} placeholder="https://wa.me/1234567890" />
            </div>
            <div>
              <FieldLabel>Telegram</FieldLabel>
              <TextInput value={socialTelegram} onChange={setSocialTelegram} placeholder="https://t.me/yourchannel" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Discord</FieldLabel>
              <TextInput value={socialDiscord} onChange={setSocialDiscord} placeholder="https://discord.gg/invite-code" />
            </div>
            <div>
              <FieldLabel>X (Twitter)</FieldLabel>
              <TextInput value={socialX} onChange={setSocialX} placeholder="https://x.com/yourhandle" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Instagram</FieldLabel>
              <TextInput value={socialInstagram} onChange={setSocialInstagram} placeholder="https://instagram.com/yourhandle" />
            </div>
            <div>
              <FieldLabel>YouTube</FieldLabel>
              <TextInput value={socialYoutube} onChange={setSocialYoutube} placeholder="https://youtube.com/@yourchannel" />
            </div>
          </div>
        </div>
      </SectionCard>
    );
  }
}
