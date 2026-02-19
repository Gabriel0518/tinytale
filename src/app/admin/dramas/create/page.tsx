"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";

// ── Types ──────────────────────────────────────────────
interface Episode {
  id: string;
  name: string;
  fileName: string;
  size: string;
  subtitleFile: string | null;
  price: number | null;
  cover: string | null;
  description: string;
  duration: string;
  status: "uploading" | "processing" | "ready";
  uploadProgress: number;
}

interface FormData {
  verticalCover: string | null;
  horizontalCover: string | null;
  dramaName: string;
  synopsis: string;
  categories: string[];
  regions: string[];
  tags: string;
  activity: string;
  episodes: Episode[];
  monetizationModel: "free" | "partial" | "premium";
  freeEpisodeCount: number;
  defaultPrice: number;
  vipEarlyAccess: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  publishOption: "now" | "schedule";
  scheduleDate: string;
}

const STEPS = [
  { num: 1, label: "Basic Info" },
  { num: 2, label: "Video & Subtitles" },
  { num: 3, label: "Payment Settings" },
  { num: 4, label: "SEO & Publish" },
] as const;

const INITIAL_FORM: FormData = {
  verticalCover: null,
  horizontalCover: null,
  dramaName: "",
  synopsis: "",
  categories: ["Romance", "Historical"],
  regions: [],
  tags: "",
  activity: "none",
  episodes: [],
  monetizationModel: "partial",
  freeEpisodeCount: 3,
  defaultPrice: 15,
  vipEarlyAccess: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  publishOption: "now",
  scheduleDate: "",
};

const COUNTRY_GROUPS = [
  { label: "North America", countries: ["United States", "Canada", "Mexico", "Guatemala", "Cuba", "Haiti", "Dominican Republic", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama", "Jamaica", "Trinidad and Tobago", "Bahamas", "Barbados", "Belize"] },
  { label: "South America", countries: ["Brazil", "Argentina", "Colombia", "Peru", "Venezuela", "Chile", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname"] },
  { label: "Western Europe", countries: ["United Kingdom", "France", "Germany", "Netherlands", "Belgium", "Luxembourg", "Switzerland", "Austria", "Ireland", "Monaco", "Liechtenstein"] },
  { label: "Southern Europe", countries: ["Spain", "Italy", "Portugal", "Greece", "Malta", "Cyprus", "Andorra", "San Marino", "Vatican City"] },
  { label: "Northern Europe", countries: ["Sweden", "Norway", "Denmark", "Finland", "Iceland", "Estonia", "Latvia", "Lithuania"] },
  { label: "Eastern Europe", countries: ["Poland", "Czech Republic", "Slovakia", "Hungary", "Romania", "Bulgaria", "Ukraine", "Belarus", "Moldova", "Serbia", "Croatia", "Bosnia and Herzegovina", "Slovenia", "Montenegro", "North Macedonia", "Albania", "Kosovo"] },
  { label: "Russia & Central Asia", countries: ["Russia", "Kazakhstan", "Uzbekistan", "Turkmenistan", "Kyrgyzstan", "Tajikistan", "Georgia", "Armenia", "Azerbaijan"] },
  { label: "East Asia", countries: ["China", "Japan", "South Korea", "North Korea", "Taiwan", "Mongolia", "Hong Kong", "Macau"] },
  { label: "Southeast Asia", countries: ["Thailand", "Vietnam", "Philippines", "Indonesia", "Malaysia", "Singapore", "Myanmar", "Cambodia", "Laos", "Brunei", "Timor-Leste"] },
  { label: "South Asia", countries: ["India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Afghanistan"] },
  { label: "Middle East", countries: ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Iraq", "Iran", "Jordan", "Lebanon", "Syria", "Israel", "Palestine", "Turkey"] },
  { label: "North Africa", countries: ["Egypt", "Libya", "Tunisia", "Algeria", "Morocco", "Sudan", "South Sudan"] },
  { label: "West Africa", countries: ["Nigeria", "Ghana", "Senegal", "Ivory Coast", "Mali", "Burkina Faso", "Niger", "Guinea", "Sierra Leone", "Liberia", "Togo", "Benin", "Gambia", "Cape Verde", "Mauritania"] },
  { label: "East Africa", countries: ["Kenya", "Ethiopia", "Tanzania", "Uganda", "Rwanda", "Burundi", "Somalia", "Eritrea", "Djibouti", "Madagascar", "Mauritius", "Seychelles", "Comoros"] },
  { label: "Central Africa", countries: ["Democratic Republic of Congo", "Republic of Congo", "Cameroon", "Central African Republic", "Chad", "Gabon", "Equatorial Guinea", "São Tomé and Príncipe"] },
  { label: "Southern Africa", countries: ["South Africa", "Namibia", "Botswana", "Zimbabwe", "Zambia", "Mozambique", "Angola", "Malawi", "Lesotho", "Eswatini"] },
  { label: "Oceania", countries: ["Australia", "New Zealand", "Papua New Guinea", "Fiji", "Samoa", "Tonga", "Vanuatu", "Solomon Islands", "Micronesia", "Palau", "Marshall Islands", "Kiribati", "Nauru", "Tuvalu"] },
];

// ── Icons ──────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────
export default function CreateDramaPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [categoryInput, setCategoryInput] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handlePublish = async (status: "published" | "draft") => {
    setSaving(true);
    try {
      await adminApi.createDrama({
        title: form.dramaName,
        description: form.synopsis,
        categories: form.categories,
        regions: form.regions,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        status,
        cover: form.verticalCover || "",
        horizontalCover: form.horizontalCover || "",
        monetizationModel: form.monetizationModel,
        freeEpisodeCount: form.freeEpisodeCount,
        defaultPrice: form.defaultPrice,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoKeywords: form.seoKeywords,
        publishOption: form.publishOption,
        scheduleDate: form.scheduleDate,
      });
      router.push("/admin/dramas");
    } catch (err: any) {
      alert(err.message || "Failed to create drama");
    } finally {
      setSaving(false);
    }
  };

  const updateForm = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addCategory = () => {
    const val = categoryInput.trim();
    if (val && !form.categories.includes(val)) {
      updateForm("categories", [...form.categories, val]);
    }
    setCategoryInput("");
  };

  const removeCategory = (cat: string) => {
    updateForm(
      "categories",
      form.categories.filter((c) => c !== cat)
    );
  };

  const verticalCoverRef = useRef<HTMLInputElement>(null);
  const horizontalCoverRef = useRef<HTMLInputElement>(null);

  const triggerUpload = (field: "verticalCover" | "horizontalCover") => {
    const ref = field === "verticalCover" ? verticalCoverRef : horizontalCoverRef;
    ref.current?.click();
  };

  const handleFileChange = (
    field: "verticalCover" | "horizontalCover",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateForm(field, url);
    }
    e.target.value = "";
  };

  const addMockEpisode = () => {
    const num = form.episodes.length + 1;
    const ep: Episode = {
      id: `ep-${Date.now()}`,
      name: `Episode ${num}`,
      fileName: `episode_${num}_final.mp4`,
      size: `${(Math.random() * 200 + 50).toFixed(0)} MB`,
      subtitleFile: null,
      price: null,
      cover: null,
      description: "",
      duration: `${Math.floor(Math.random() * 10 + 8)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      status: "ready",
      uploadProgress: 100,
    };
    updateForm("episodes", [...form.episodes, ep]);
  };

  const removeEpisode = (id: string) => {
    updateForm(
      "episodes",
      form.episodes.filter((e) => e.id !== id)
    );
  };

  const updateEpisode = (id: string, updates: Partial<Episode>) => {
    updateForm(
      "episodes",
      form.episodes.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-[#0f0f17] flex flex-col">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0f0f17]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dramas"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon />
            </Link>
            <h1 className="text-lg font-semibold text-white">
              Create New Drama
            </h1>
          </div>
          <button onClick={() => handlePublish("draft")} disabled={saving} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save as Draft"}
          </button>
        </div>
      </header>

      {/* ── Progress Stepper ── */}
      <div className="border-b border-gray-800 bg-[#0f0f17]">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      step > s.num
                        ? "bg-indigo-600 text-white"
                        : step === s.num
                        ? "bg-indigo-600 text-white"
                        : "border-2 border-gray-700 text-gray-500"
                    }`}
                  >
                    {step > s.num ? <CheckIcon /> : s.num}
                  </div>
                  <span
                    className={`text-sm font-medium whitespace-nowrap ${
                      step >= s.num ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-4 h-px flex-1 bg-gray-800">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: step > s.num ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {step === 1 && (
            <StepBasicInfo
              form={form}
              updateForm={updateForm}
              categoryInput={categoryInput}
              setCategoryInput={setCategoryInput}
              addCategory={addCategory}
              removeCategory={removeCategory}
              triggerUpload={triggerUpload}
              handleFileChange={handleFileChange}
              verticalCoverRef={verticalCoverRef}
              horizontalCoverRef={horizontalCoverRef}
            />
          )}
          {step === 2 && (
            <StepVideoSubtitles
              form={form}
              updateForm={updateForm}
              addMockEpisode={addMockEpisode}
              removeEpisode={removeEpisode}
              updateEpisode={updateEpisode}
            />
          )}
          {step === 3 && (
            <StepPayment
              form={form}
              updateForm={updateForm}
              updateEpisode={updateEpisode}
            />
          )}
          {step === 4 && (
            <StepSeoPublish form={form} updateForm={updateForm} />
          )}
        </div>
      </div>

      {/* ── Sticky Footer ── */}
      <footer className="sticky bottom-0 z-50 border-t border-gray-800 bg-[#0f0f17]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-700 px-5 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
          >
            Cancel
          </button>
          <span className="text-sm text-gray-500">Step {step} of 4</span>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="rounded-lg border border-gray-700 px-5 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
              >
                &larr; Previous
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Next Step &rarr;
              </button>
            ) : (
              <button onClick={() => handlePublish("published")} disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Publishing..." : "Publish"}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Step 1: Basic Info ─────────────────────────────────
// ── Region Picker ─────────────────────────────────────
function RegionPicker({ regions, onChange }: { regions: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (country: string) => {
    onChange(regions.includes(country) ? regions.filter((r) => r !== country) : [...regions, country]);
  };

  const toggleGroup = (countries: string[]) => {
    const allSelected = countries.every((c) => regions.includes(c));
    if (allSelected) {
      onChange(regions.filter((r) => !countries.includes(r)));
    } else {
      const merged = new Set([...regions, ...countries]);
      onChange(Array.from(merged));
    }
  };

  const filtered = COUNTRY_GROUPS.map((g) => ({
    ...g,
    countries: g.countries.filter((c) => c.toLowerCase().includes(search.toLowerCase())),
  })).filter((g) => g.countries.length > 0);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-gray-300">Region / Countries</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-left transition-colors focus:border-indigo-600"
      >
        {regions.length === 0 && <span className="text-sm text-gray-500">Select countries...</span>}
        {regions.slice(0, 5).map((r) => (
          <span key={r} className="inline-flex items-center gap-1 rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
            {r}
            <button type="button" onClick={(e) => { e.stopPropagation(); toggle(r); }} className="hover:text-white transition-colors">
              <XIcon />
            </button>
          </span>
        ))}
        {regions.length > 5 && <span className="text-xs text-gray-500">+{regions.length - 5} more</span>}
        <svg xmlns="http://www.w3.org/2000/svg" className={`ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-700 bg-[#1a1a2e] shadow-xl">
          <div className="sticky top-0 bg-[#1a1a2e] p-2 border-b border-gray-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full rounded-md border border-gray-700 bg-[#13131d] px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-600"
              autoFocus
            />
          </div>
          {filtered.map((group) => {
            const allSelected = group.countries.every((c) => regions.includes(c));
            const someSelected = group.countries.some((c) => regions.includes(c));
            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.countries)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-white/5"
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${allSelected ? "border-indigo-600 bg-indigo-600" : someSelected ? "border-indigo-600 bg-indigo-600/40" : "border-gray-600"}`}>
                    {(allSelected || someSelected) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={allSelected ? "M5 13l4 4L19 7" : "M5 12h14"} />
                      </svg>
                    )}
                  </span>
                  {group.label}
                </button>
                {group.countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggle(country)}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 pl-7 text-sm text-gray-300 hover:bg-white/5"
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${regions.includes(country) ? "border-indigo-600 bg-indigo-600" : "border-gray-600"}`}>
                      {regions.includes(country) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {country}
                  </button>
                ))}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="px-3 py-4 text-center text-sm text-gray-500">No countries found</p>}
        </div>
      )}
    </div>
  );
}

interface StepBasicInfoProps {
  form: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  categoryInput: string;
  setCategoryInput: (v: string) => void;
  addCategory: () => void;
  removeCategory: (cat: string) => void;
  triggerUpload: (field: "verticalCover" | "horizontalCover") => void;
  handleFileChange: (field: "verticalCover" | "horizontalCover", e: React.ChangeEvent<HTMLInputElement>) => void;
  verticalCoverRef: React.RefObject<HTMLInputElement>;
  horizontalCoverRef: React.RefObject<HTMLInputElement>;
}

function StepBasicInfo({
  form,
  updateForm,
  categoryInput,
  setCategoryInput,
  addCategory,
  removeCategory,
  triggerUpload,
  handleFileChange,
  verticalCoverRef,
  horizontalCoverRef,
}: StepBasicInfoProps) {
  return (
    <div className="space-y-8">
      {/* Visual Assets */}
      <div className="rounded-xl bg-[#1a1a2e] p-6">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Visual Assets</h2>
          <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
            Required
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Vertical Cover */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Vertical Cover (2:3)
            </label>
            <input
              ref={verticalCoverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange("verticalCover", e)}
            />
            <button
              onClick={() => triggerUpload("verticalCover")}
              className={`relative flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
                form.verticalCover
                  ? "border-indigo-600 bg-indigo-600/5"
                  : "border-gray-700 hover:border-gray-500"
              }`}
            >
              {form.verticalCover ? (
                <>
                  <img
                    src={form.verticalCover}
                    alt="Vertical cover preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-sm text-white font-medium">Click to replace</p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-2"><UploadIcon /></div>
                  <p className="text-sm text-gray-400">Click to upload</p>
                  <p className="mt-1 text-xs text-gray-600">
                    JPG, PNG (Max 5MB)
                  </p>
                </div>
              )}
            </button>
          </div>

          {/* Horizontal Cover */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Horizontal Cover (Banner)
            </label>
            <input
              ref={horizontalCoverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange("horizontalCover", e)}
            />
            <button
              onClick={() => triggerUpload("horizontalCover")}
              className={`relative flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
                form.horizontalCover
                  ? "border-indigo-600 bg-indigo-600/5"
                  : "border-gray-700 hover:border-gray-500"
              }`}
            >
              {form.horizontalCover ? (
                <>
                  <img
                    src={form.horizontalCover}
                    alt="Horizontal cover preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-sm text-white font-medium">Click to replace</p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-2"><UploadIcon /></div>
                  <p className="text-sm text-gray-400">Click to upload</p>
                  <p className="mt-1 text-xs text-gray-600">
                    1920x1080 recommended
                  </p>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-600/5 p-3">
          <InfoIcon />
          <p className="text-xs text-gray-400">
            Horizontal covers are used for featured banners on the homepage and
            category pages. Use high-quality images for the best visual impact.
          </p>
        </div>
      </div>

      {/* Drama Details */}
      <div className="rounded-xl bg-[#1a1a2e] p-6">
        <h2 className="mb-5 text-base font-semibold text-white">
          Drama Details
        </h2>

        <div className="space-y-5">
          {/* Drama Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Drama Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.dramaName}
              onChange={(e) => updateForm("dramaName", e.target.value)}
              placeholder="e.g. The Last Empress of Joseon"
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-600"
            />
          </div>

          {/* Synopsis */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Synopsis / Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.synopsis}
              onChange={(e) => {
                if (e.target.value.length <= 500)
                  updateForm("synopsis", e.target.value);
              }}
              rows={4}
              placeholder="Write a compelling synopsis for your drama..."
              className="w-full resize-none rounded-lg border border-gray-700 bg-[#13131d] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-600"
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {form.synopsis.length}/500
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Category
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2.5">
              {form.categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-400"
                >
                  {cat}
                  <button
                    onClick={() => removeCategory(cat)}
                    className="hover:text-white transition-colors"
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="Add category..."
                className="min-w-[120px] flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>

          {/* Region (Multi-select Countries) */}
          <RegionPicker regions={form.regions} onChange={(v) => updateForm("regions", v)} />

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Tags
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                #
              </span>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
                placeholder="romance, historical, drama (comma separated)"
                className="w-full rounded-lg border border-gray-700 bg-[#13131d] py-2.5 pl-8 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Participate in Activity */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Participate in Activity
            </label>
            <select
              value={form.activity}
              onChange={(e) => updateForm("activity", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-600"
            >
              <option value="none">None</option>
              <option value="summer-fest">Summer Festival 2026</option>
              <option value="new-year">New Year Special</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Video & Subtitles ──────────────────────────
type UploadMode = "full" | "episode";

interface StepVideoSubtitlesProps {
  form: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  addMockEpisode: () => void;
  removeEpisode: (id: string) => void;
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
}

function StepVideoSubtitles({
  form,
  updateForm,
  addMockEpisode,
  removeEpisode,
  updateEpisode,
}: StepVideoSubtitlesProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>("full");
  const [splitDuration, setSplitDuration] = useState(45);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [uploadFileProgress, setUploadFileProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate sequential upload for episode mode
  useEffect(() => {
    if (uploadQueue.length === 0 || isUploading) return;
    setIsUploading(true);
    const file = uploadQueue[0];
    const epId = `ep-${Date.now()}`;
    const num = form.episodes.length + 1;
    const newEp: Episode = {
      id: epId,
      name: file.name.replace(/\.[^.]+$/, ""),
      fileName: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(0)} MB`,
      subtitleFile: null,
      price: null,
      cover: null,
      description: "",
      duration: `${Math.floor(Math.random() * 10 + 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      status: "uploading",
      uploadProgress: 0,
    };
    updateForm("episodes", [...form.episodes, newEp]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateForm("episodes", form.episodes.map((e) => e.id === epId ? e : e).concat().length > 0
          ? [...form.episodes.filter((e) => e.id !== epId), { ...newEp, status: "ready" as const, uploadProgress: 100 }]
          : [{ ...newEp, status: "ready" as const, uploadProgress: 100 }]
        );
        setUploadQueue((q) => q.slice(1));
        setIsUploading(false);
      }
    }, 300);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadQueue, isUploading]);

  const handleFullUpload = () => {
    // Simulate file upload with progress
    setUploadingFileName("series_pilot_raw.mp4");
    setUploadFileProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadFileProgress(100);
        // After upload completes, generate split episodes
        setTimeout(() => {
          const totalMinutes = Math.floor(Math.random() * 60 + 60);
          const count = Math.ceil(totalMinutes / splitDuration);
          const episodes: Episode[] = [];
          for (let i = 0; i < count; i++) {
            const dur = i === count - 1
              ? totalMinutes - splitDuration * i
              : splitDuration;
            episodes.push({
              id: `ep-${Date.now()}-${i}`,
              name: `Episode ${i + 1}`,
              fileName: `episode_${i + 1}.mp4`,
              size: `${(Math.random() * 150 + 30).toFixed(0)} MB`,
              subtitleFile: null,
              price: null,
              cover: null,
              description: "",
              duration: `${dur}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
              status: i < count - 1 ? "ready" : "processing",
              uploadProgress: i < count - 1 ? 100 : Math.floor(Math.random() * 60 + 20),
            });
          }
          updateForm("episodes", episodes);
          setUploadingFileName(null);
        }, 500);
      } else {
        setUploadFileProgress(progress);
      }
    }, 200);
  };

  const handleEpisodeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 50);
    if (files.length === 0) return;
    setUploadQueue(files);
    e.target.value = "";
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const eps = [...form.episodes];
    const [moved] = eps.splice(dragIdx, 1);
    eps.splice(idx, 0, moved);
    updateForm("episodes", eps);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const readyCount = form.episodes.filter((e) => e.status === "ready").length;

  return (
    <div className="space-y-8">
      {/* Upload Videos Card */}
      <div className="rounded-xl bg-[#1a1a2e] p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h2 className="text-base font-semibold text-white">Upload Videos</h2>
          </div>
          <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">Required</span>
        </div>

        {/* Upload Mode Toggle - Pill Buttons */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => setUploadMode("full")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              uploadMode === "full"
                ? "bg-indigo-600 text-white"
                : "border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
            }`}
          >
            Upload Full Series
          </button>
          <button
            onClick={() => setUploadMode("episode")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              uploadMode === "episode"
                ? "bg-indigo-600 text-white"
                : "border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
            }`}
          >
            Upload Multiple Episodes
          </button>
        </div>

        {/* Mode Description */}
        {uploadMode === "full" ? (
          <div className="mb-5 space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-indigo-600/30 bg-indigo-600/5 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-indigo-400">Auto-Split Technology</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Upload your full-length video file. Our system will automatically detect scene changes and split them into episodes based on duration settings. Subtitle files (.srt, .vtt) matched by filename will be automatically associated.
                </p>
              </div>
            </div>
            {/* Auto-Split Duration Card */}
            <div className="rounded-lg border border-gray-800 bg-[#13131d] p-4">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Auto-Split Duration (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={splitDuration}
                  onChange={(e) => setSplitDuration(Math.max(1, Math.min(120, Number(e.target.value))))}
                  className="w-20 rounded-lg border border-gray-700 bg-[#0f0f17] px-3 py-2 text-sm text-white outline-none focus:border-indigo-600"
                />
                <span className="text-sm text-gray-500">min / episode</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-indigo-600/30 bg-indigo-600/5 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <div>
              <p className="text-sm font-medium text-indigo-400">Batch Episode Upload</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Upload up to 50 video files at once. Files will be uploaded sequentially one at a time. Default title uses the filename, and the first frame is used as the cover.
              </p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple={uploadMode === "episode"}
          className="hidden"
          onChange={uploadMode === "episode" ? handleEpisodeFiles : () => {
            handleFullUpload();
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 py-12 transition-colors hover:border-indigo-600/50 hover:bg-indigo-600/5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-300">
            Drag & drop video{uploadMode === "episode" ? "s" : ""} here
          </p>
          <p className="mt-1 text-xs text-gray-500">
            or <span className="text-indigo-400">browse</span> from your computer
          </p>
          <p className="mt-2 text-xs text-gray-600">
            MP4, MOV, MKV (Max {uploadMode === "full" ? "10GB" : "2GB per file"}). SRT, VTT supported.
          </p>
        </button>

        {/* File Upload Progress */}
        {uploadingFileName && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#13131d] px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="shrink-0 text-sm text-gray-300">{uploadingFileName}</span>
            <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${uploadFileProgress}%` }}
              />
            </div>
            <button
              onClick={() => setUploadingFileName(null)}
              className="shrink-0 rounded p-1 text-gray-500 transition-colors hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Generated Episodes */}
      {form.episodes.length > 0 && (
        <div className="rounded-xl bg-[#1a1a2e] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-base font-semibold text-white">Generated Episodes</h2>
              <span className="rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
                {readyCount} Ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-500 hover:text-white">
                Bulk Edit
              </button>
              <button className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-500 hover:text-white">
                Sort
              </button>
            </div>
          </div>

          {/* Episode Card Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.episodes.map((ep, idx) => (
              <div
                key={ep.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`group relative rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  dragOverIdx === idx
                    ? "border-indigo-600 bg-indigo-600/10"
                    : dragIdx === idx
                    ? "opacity-50 border-gray-800 bg-[#13131d]"
                    : "border-gray-800 bg-[#13131d] hover:border-gray-700"
                }`}
              >
                {/* Cover / Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-gray-900">
                  {ep.status === "uploading" ? (
                    <div className="flex h-full flex-col items-center justify-center">
                      <div className="relative h-10 w-10">
                        <svg className="h-10 w-10 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">Uploading... {Math.round(ep.uploadProgress)}%</p>
                      <div className="mt-2 h-1 w-3/4 overflow-hidden rounded-full bg-gray-800">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${ep.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : ep.status === "processing" ? (
                    <div className="flex h-full flex-col items-center justify-center relative">
                      {/* Progress bar at top */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${ep.uploadProgress}%` }} />
                      </div>
                      <svg className="h-8 w-8 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="mt-2 text-xs text-gray-400">Processing...</p>
                    </div>
                  ) : ep.cover ? (
                    <img src={ep.cover} alt={ep.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Episode badge */}
                  <span className="absolute left-2 top-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Ep {String(idx + 1).padStart(2, "0")}
                  </span>
                  {/* Duration badge */}
                  {ep.status === "ready" && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {ep.duration}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-3">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="text"
                      value={ep.name}
                      onChange={(e) => updateEpisode(ep.id, { name: e.target.value })}
                      className="flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder-gray-600"
                      placeholder="Episode title"
                    />
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      ep.status === "ready"
                        ? "bg-green-500/20 text-green-400"
                        : ep.status === "processing"
                        ? "text-indigo-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {ep.status === "processing" ? `PROCESSING ${Math.round(ep.uploadProgress)}%` : ep.status}
                    </span>
                  </div>

                  {/* Synopsis */}
                  <textarea
                    value={ep.description}
                    onChange={(e) => updateEpisode(ep.id, { description: e.target.value })}
                    placeholder="Episode synopsis..."
                    rows={2}
                    className="mt-2 w-full resize-none bg-transparent text-xs text-gray-400 outline-none placeholder-gray-600"
                  />

                  {/* Footer: Subtitle + Delete */}
                  <div className="mt-2 flex items-center justify-between border-t border-gray-800 pt-2">
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {ep.subtitleFile ? (
                        <span className="text-[10px] text-green-400">{ep.subtitleFile.includes(",") ? ep.subtitleFile : "EN"}</span>
                      ) : (
                        <button
                          onClick={() => updateEpisode(ep.id, { subtitleFile: "EN, KR" })}
                          className="text-[10px] text-gray-500 hover:text-indigo-400 transition-colors"
                        >
                          + Subtitle
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => removeEpisode(ep.id)}
                      className="rounded p-1 text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Episode Manually Card */}
            <button
              onClick={addMockEpisode}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-800 py-16 transition-colors hover:border-gray-600 hover:bg-white/[0.02]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-700 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-500">Add Episode Manually</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Payment Settings ──────────────────────────
interface StepPaymentProps {
  form: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
}

function StepPayment({ form, updateForm }: StepPaymentProps) {
  const models = [
    { key: "free" as const, icon: "smile", label: "Free to Watch", desc: "Ad-supported only" },
    { key: "partial" as const, icon: "half", label: "Partially Paid", desc: "First few eps free" },
    { key: "premium" as const, icon: "lock", label: "Premium Only", desc: "Pay for all eps" },
  ];

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Payment Strategy Card */}
        <div className="rounded-xl bg-[#1a1a2e] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-base font-semibold text-white">Payment Strategy</h2>
            </div>
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">Required</span>
          </div>

          {/* Monetization Model */}
          <p className="mb-3 text-sm font-medium text-gray-300">Monetization Model</p>
          <div className="mb-6 grid grid-cols-3 gap-3">
            {models.map((m) => (
              <button
                key={m.key}
                onClick={() => updateForm("monetizationModel", m.key)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border p-5 transition-all ${
                  form.monetizationModel === m.key
                    ? "border-indigo-600 bg-indigo-600/10"
                    : "border-gray-800 bg-[#13131d] hover:border-gray-700"
                }`}
              >
                {/* Selection indicator */}
                <div className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                  form.monetizationModel === m.key
                    ? "border-indigo-600 bg-indigo-600"
                    : "border-gray-700"
                }`}>
                  {form.monetizationModel === m.key && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {/* Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800">
                  {m.icon === "smile" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {m.icon === "half" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {m.icon === "lock" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-white">{m.label}</span>
                <span className="text-[11px] text-gray-500">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* Free Episodes Count (only for partial) */}
          {form.monetizationModel === "partial" && (
            <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-800 bg-[#13131d] p-4">
              <div>
                <p className="text-sm font-medium text-white">Free Episodes Count</p>
                <p className="mt-0.5 text-xs text-gray-500">Users can watch these episodes without paying.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={form.episodes.length || 10}
                  value={form.freeEpisodeCount}
                  onChange={(e) => updateForm("freeEpisodeCount", Math.max(1, Number(e.target.value)))}
                  className="w-14 rounded-lg border border-gray-700 bg-[#0f0f17] px-2 py-1.5 text-center text-sm text-white outline-none focus:border-indigo-600"
                />
                <span className="text-sm text-gray-500">eps</span>
              </div>
            </div>
          )}

          {/* Divider */}
          {form.monetizationModel !== "free" && <div className="mb-6 border-t border-gray-800" />}

          {/* Single Episode Price */}
          {form.monetizationModel !== "free" && (
            <div className="mb-6">
              <p className="mb-3 text-sm font-medium text-gray-300">Single Episode Price</p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CoinIcon />
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form.defaultPrice}
                    onChange={(e) => updateForm("defaultPrice", Math.max(1, Number(e.target.value)))}
                    className="w-28 rounded-lg border border-gray-700 bg-[#13131d] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-600"
                  />
                </div>
                <span className="text-sm text-gray-400">Coins</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">Standard price per episode unlock.</p>
            </div>
          )}

          {/* VIP Early Access */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-800 bg-[#13131d] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">VIP Early Access / Exclusive</p>
              <p className="mt-0.5 text-xs text-gray-500">VIP members watch for free. Enable early access to episodes 24h before free users.</p>
            </div>
            <button
              onClick={() => updateForm("vipEarlyAccess", !form.vipEarlyAccess)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                form.vipEarlyAccess ? "bg-indigo-600" : "bg-gray-700"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                form.vipEarlyAccess ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden w-72 shrink-0 space-y-4 lg:block">
        {/* Drama Summary */}
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Drama Summary</p>
          <div className="mb-4 flex items-start gap-3">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-800">
              {form.verticalCover ? (
                <img src={form.verticalCover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{form.dramaName || "Untitled Drama"}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {form.categories.slice(0, 2).map((c) => (
                  <span key={c} className="rounded bg-indigo-600/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">{c}</span>
                ))}
              </div>
              {form.activity !== "none" && (
                <span className="mt-1 inline-block rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                  {form.activity === "summer-fest" ? "Summer Event" : "New Year"}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2.5 border-t border-gray-800 pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Region</span>
              <span className="text-right text-white text-xs max-w-[140px] truncate">{form.regions.length === 0 ? "Global" : form.regions.slice(0, 3).join(", ") + (form.regions.length > 3 ? ` +${form.regions.length - 3}` : "")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total Episodes</span>
              <span className="text-white">{form.episodes.length || "—"} (Estimated)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className="text-indigo-400">Draft</span>
            </div>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5">
          <div className="mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-sm font-semibold text-white">Pro Tip</p>
          </div>
          <p className="text-xs leading-relaxed text-indigo-100/80">
            Setting the first 3-5 episodes as free increases user retention by 40%. Consider enabling VIP early access to boost subscription conversions.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: SEO & Publish ──────────────────────────────
interface StepSeoPublishProps {
  form: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

function StepSeoPublish({ form, updateForm }: StepSeoPublishProps) {
  return (
    <div className="space-y-8">
      {/* SEO Settings */}
      <div className="rounded-xl bg-[#1a1a2e] p-6">
        <h2 className="mb-5 text-base font-semibold text-white">
          SEO Settings
        </h2>

        <div className="space-y-5">
          {/* SEO Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              SEO Title
            </label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => updateForm("seoTitle", e.target.value)}
              placeholder="Enter SEO-friendly title..."
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              Recommended: 50-60 characters
            </p>
          </div>

          {/* SEO Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              SEO Description
            </label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => updateForm("seoDescription", e.target.value)}
              rows={3}
              placeholder="Write a meta description for search engines..."
              className="w-full resize-none rounded-lg border border-gray-700 bg-[#13131d] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              Recommended: 150-160 characters
            </p>
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              SEO Keywords
            </label>
            <input
              type="text"
              value={form.seoKeywords}
              onChange={(e) => updateForm("seoKeywords", e.target.value)}
              placeholder="short drama, romance, historical (comma separated)"
              className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Publish Options */}
      <div className="rounded-xl bg-[#1a1a2e] p-6">
        <h2 className="mb-5 text-base font-semibold text-white">
          Publish Options
        </h2>

        <div className="space-y-4">
          {/* Publish Now */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-[#13131d] p-4 transition-colors hover:border-gray-600">
            <input
              type="radio"
              name="publishOption"
              value="now"
              checked={form.publishOption === "now"}
              onChange={() => updateForm("publishOption", "now")}
              className="h-4 w-4 border-gray-600 bg-transparent text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
            />
            <div>
              <p className="text-sm font-medium text-white">Publish Now</p>
              <p className="mt-0.5 text-xs text-gray-500">
                The drama will be live immediately after publishing
              </p>
            </div>
          </label>

          {/* Schedule */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-[#13131d] p-4 transition-colors hover:border-gray-600">
            <input
              type="radio"
              name="publishOption"
              value="schedule"
              checked={form.publishOption === "schedule"}
              onChange={() => updateForm("publishOption", "schedule")}
              className="h-4 w-4 border-gray-600 bg-transparent text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                Schedule for Later
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Choose a date and time to publish
              </p>
            </div>
          </label>

          {form.publishOption === "schedule" && (
            <div className="ml-7">
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Schedule Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduleDate}
                onChange={(e) => updateForm("scheduleDate", e.target.value)}
                className="w-full max-w-xs rounded-lg border border-gray-700 bg-[#13131d] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-600 [color-scheme:dark]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview Summary */}
      <div className="rounded-xl bg-[#1a1a2e] p-6">
        <h2 className="mb-5 text-base font-semibold text-white">Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Drama Name</p>
            <p className="mt-1 text-white">{form.dramaName || "\u2014"}</p>
          </div>
          <div>
            <p className="text-gray-500">Episodes</p>
            <p className="mt-1 text-white">{form.episodes.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Categories</p>
            <p className="mt-1 text-white">
              {form.categories.join(", ") || "\u2014"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Pricing</p>
            <p className="mt-1 text-white">
              {form.monetizationModel === "free"
                ? "Free"
                : form.monetizationModel === "partial"
                  ? `Partial (${form.freeEpisodeCount} free) · ${form.defaultPrice} coins/ep`
                  : `${form.defaultPrice} coins/episode`}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Publish</p>
            <p className="mt-1 text-white">
              {form.publishOption === "now"
                ? "Immediately"
                : form.scheduleDate || "Not scheduled"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Covers</p>
            <p className="mt-1 text-white">
              {[
                form.verticalCover && "Vertical",
                form.horizontalCover && "Horizontal",
              ]
                .filter(Boolean)
                .join(", ") || "None uploaded"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}