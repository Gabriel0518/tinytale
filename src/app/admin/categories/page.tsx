"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";

// ── Types ──────────────────────────────────────────────
type TabKey = "genres" | "regions" | "tags";
type CategoryStatus = "Active" | "Disabled";

interface Category {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  type: TabKey;
  countries: string[];
  linkedDramas: number;
  status: CategoryStatus;
  weight: number;
}

interface CategoryFormData {
  name: string;
  icon: string;
  type: TabKey;
  countries: string[];
  status: CategoryStatus;
  weight: number;
}

// ── Mock Data ──────────────────────────────────────────
const MOCK_CATEGORIES: Category[] = [
  { id: "g1", name: "Romance", icon: "heart", iconColor: "#f43f5e", type: "genres", countries: [], linkedDramas: 128, status: "Active", weight: 10 },
  { id: "g2", name: "Thriller", icon: "zap", iconColor: "#f59e0b", type: "genres", countries: [], linkedDramas: 85, status: "Active", weight: 9 },
  { id: "g3", name: "Comedy", icon: "smile", iconColor: "#22c55e", type: "genres", countries: [], linkedDramas: 64, status: "Active", weight: 8 },
  { id: "g4", name: "Fantasy", icon: "star", iconColor: "#a855f7", type: "genres", countries: [], linkedDramas: 42, status: "Active", weight: 7 },
  { id: "g5", name: "Horror", icon: "skull", iconColor: "#64748b", type: "genres", countries: [], linkedDramas: 0, status: "Disabled", weight: 3 },
  { id: "g6", name: "Action", icon: "flame", iconColor: "#ef4444", type: "genres", countries: [], linkedDramas: 56, status: "Active", weight: 6 },
  { id: "g7", name: "Drama", icon: "theater", iconColor: "#3b82f6", type: "genres", countries: [], linkedDramas: 91, status: "Active", weight: 5 },
  { id: "r1", name: "North America", icon: "globe", iconColor: "#3b82f6", type: "regions", countries: ["United States", "Canada", "Mexico"], linkedDramas: 210, status: "Active", weight: 10 },
  { id: "r2", name: "Southeast Asia", icon: "globe", iconColor: "#10b981", type: "regions", countries: ["Thailand", "Vietnam", "Philippines", "Indonesia", "Malaysia", "Singapore"], linkedDramas: 145, status: "Active", weight: 9 },
  { id: "r3", name: "Europe", icon: "globe", iconColor: "#8b5cf6", type: "regions", countries: ["United Kingdom", "Germany", "France", "Spain", "Italy", "Netherlands"], linkedDramas: 78, status: "Active", weight: 8 },
  { id: "r4", name: "Latin America", icon: "globe", iconColor: "#f59e0b", type: "regions", countries: ["Brazil", "Argentina", "Colombia", "Chile", "Peru"], linkedDramas: 52, status: "Active", weight: 7 },
  { id: "r5", name: "Middle East", icon: "globe", iconColor: "#ef4444", type: "regions", countries: ["Saudi Arabia", "UAE", "Turkey", "Egypt"], linkedDramas: 0, status: "Disabled", weight: 2 },
  { id: "t1", name: "Trending", icon: "trending", iconColor: "#f43f5e", type: "tags", countries: [], linkedDramas: 35, status: "Active", weight: 10 },
  { id: "t2", name: "New Release", icon: "sparkle", iconColor: "#3b82f6", type: "tags", countries: [], linkedDramas: 48, status: "Active", weight: 9 },
  { id: "t3", name: "Editor's Pick", icon: "award", iconColor: "#f59e0b", type: "tags", countries: [], linkedDramas: 20, status: "Active", weight: 8 },
  { id: "t4", name: "Binge-worthy", icon: "play", iconColor: "#22c55e", type: "tags", countries: [], linkedDramas: 62, status: "Active", weight: 7 },
  { id: "t5", name: "Classic", icon: "bookmark", iconColor: "#a855f7", type: "tags", countries: [], linkedDramas: 30, status: "Active", weight: 6 },
  { id: "t6", name: "Archived", icon: "archive", iconColor: "#64748b", type: "tags", countries: [], linkedDramas: 0, status: "Disabled", weight: 1 },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "genres", label: "Genres" },
  { key: "regions", label: "Regions" },
  { key: "tags", label: "Tags" },
];

const ICON_MAP: Record<string, string> = {
  heart: "\u2764\uFE0F",
  zap: "\u26A1",
  smile: "\uD83D\uDE04",
  star: "\u2B50",
  skull: "\uD83D\uDC80",
  flame: "\uD83D\uDD25",
  theater: "\uD83C\uDFAD",
  globe: "\uD83C\uDF0D",
  trending: "\uD83D\uDCC8",
  sparkle: "\u2728",
  award: "\uD83C\uDFC6",
  play: "\u25B6\uFE0F",
  bookmark: "\uD83D\uDD16",
  archive: "\uD83D\uDCE6",
};

const EMPTY_FORM: CategoryFormData = { name: "", icon: "", type: "genres", countries: [], status: "Active", weight: 0 };

const ALL_COUNTRIES = [
  // North America
  "United States", "Canada", "Mexico", "Guatemala", "Cuba", "Haiti", "Dominican Republic",
  "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama", "Jamaica",
  "Trinidad and Tobago", "Bahamas", "Barbados", "Belize",
  // South America
  "Brazil", "Argentina", "Colombia", "Peru", "Venezuela", "Chile", "Ecuador",
  "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname",
  // Western Europe
  "United Kingdom", "France", "Germany", "Netherlands", "Belgium", "Luxembourg",
  "Switzerland", "Austria", "Ireland", "Monaco", "Liechtenstein",
  // Southern Europe
  "Spain", "Italy", "Portugal", "Greece", "Malta", "Cyprus", "Andorra", "San Marino", "Vatican City",
  // Northern Europe
  "Sweden", "Norway", "Denmark", "Finland", "Iceland", "Estonia", "Latvia", "Lithuania",
  // Eastern Europe
  "Poland", "Czech Republic", "Slovakia", "Hungary", "Romania", "Bulgaria", "Ukraine",
  "Belarus", "Moldova", "Serbia", "Croatia", "Bosnia and Herzegovina", "Slovenia",
  "Montenegro", "North Macedonia", "Albania", "Kosovo",
  // Russia & Central Asia
  "Russia", "Kazakhstan", "Uzbekistan", "Turkmenistan", "Kyrgyzstan", "Tajikistan",
  "Georgia", "Armenia", "Azerbaijan",
  // East Asia
  "China", "Japan", "South Korea", "North Korea", "Taiwan", "Mongolia", "Hong Kong", "Macau",
  // Southeast Asia
  "Thailand", "Vietnam", "Philippines", "Indonesia", "Malaysia", "Singapore",
  "Myanmar", "Cambodia", "Laos", "Brunei", "Timor-Leste",
  // South Asia
  "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Afghanistan",
  // Middle East
  "Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Iraq", "Iran",
  "Jordan", "Lebanon", "Syria", "Israel", "Palestine", "Turkey",
  // North Africa
  "Egypt", "Libya", "Tunisia", "Algeria", "Morocco", "Sudan", "South Sudan",
  // West Africa
  "Nigeria", "Ghana", "Senegal", "Ivory Coast", "Mali", "Burkina Faso", "Niger",
  "Guinea", "Sierra Leone", "Liberia", "Togo", "Benin", "Gambia", "Cape Verde", "Mauritania",
  // East Africa
  "Kenya", "Ethiopia", "Tanzania", "Uganda", "Rwanda", "Burundi", "Somalia",
  "Eritrea", "Djibouti", "Madagascar", "Mauritius", "Seychelles", "Comoros",
  // Central Africa
  "Democratic Republic of Congo", "Republic of Congo", "Cameroon",
  "Central African Republic", "Chad", "Gabon", "Equatorial Guinea", "São Tomé and Príncipe",
  // Southern Africa
  "South Africa", "Namibia", "Botswana", "Zimbabwe", "Zambia", "Mozambique",
  "Angola", "Malawi", "Lesotho", "Eswatini",
  // Oceania
  "Australia", "New Zealand", "Papua New Guinea", "Fiji", "Samoa", "Tonga",
  "Vanuatu", "Solomon Islands", "Micronesia", "Palau", "Marshall Islands",
  "Kiribati", "Nauru", "Tuvalu",
];

// ── Country Select ────────────────────────────────────
function CountrySelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
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
    onChange(selected.includes(country) ? selected.filter((c) => c !== country) : [...selected, country]);
  };

  const filtered = ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-sm text-gray-400">Countries</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-[38px] flex-wrap items-center gap-1 rounded-lg border border-gray-700 bg-[#13131d] px-3 py-1.5 text-left transition-colors focus:border-indigo-500"
      >
        {selected.length === 0 && <span className="text-sm text-gray-500">Select countries...</span>}
        {selected.slice(0, 4).map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-indigo-600/20 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
            {c}
            <button type="button" onClick={(e) => { e.stopPropagation(); toggle(c); }} className="hover:text-white">
              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        {selected.length > 4 && <span className="text-[11px] text-gray-500">+{selected.length - 4}</span>}
        <svg className={`ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-700 bg-[#1a1a2e] shadow-xl">
          <div className="sticky top-0 bg-[#1a1a2e] p-2 border-b border-gray-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-gray-700 bg-[#13131d] px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
          {filtered.map((country) => (
            <button
              key={country}
              type="button"
              onClick={() => toggle(country)}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected.includes(country) ? "border-indigo-600 bg-indigo-600" : "border-gray-600"}`}>
                {selected.includes(country) && (
                  <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {country}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-3 text-center text-sm text-gray-500">No countries found</p>}
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────
export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("genres");
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.getCategories();
      const items = res.data?.categories || res.data || [];
      setCategories(items.map((c: any) => ({
        id: c._id || c.id,
        name: c.name || "",
        icon: c.icon || "star",
        iconColor: c.iconColor || "#6366f1",
        type: c.type || "genres",
        countries: c.countries || [],
        linkedDramas: c.linkedDramas || 0,
        status: c.status === "Disabled" ? "Disabled" : "Active",
        weight: c.weight || c.sortOrder || 0,
      })));
    } catch {
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Derived data ──
  const filtered = useMemo(() => {
    return categories
      .filter((c) => c.type === activeTab)
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, activeTab, search]);

  const tabCategories = useMemo(() => categories.filter((c) => c.type === activeTab), [categories, activeTab]);
  const totalCount = tabCategories.length;
  const activeCount = tabCategories.filter((c) => c.status === "Active").length;
  const linkedTotal = tabCategories.reduce((sum, c) => sum + c.linkedDramas, 0);

  // ── Handlers ──
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type: activeTab });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon, type: cat.type, countries: cat.countries, status: cat.status, weight: cat.weight });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await adminApi.updateCategory(editingId, form);
      } else {
        await adminApi.createCategory({ ...form, icon: form.icon || "star", iconColor: "#6366f1" });
      }
      fetchCategories();
      toast(editingId ? "Category updated successfully" : "Category created successfully", "success");
    } catch {
      toast("Failed to save category, applied locally", "error");
      // fallback: apply locally
      if (editingId) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...form } : c))
        );
      } else {
        const newCat: Category = {
          id: `new-${Date.now()}`,
          name: form.name,
          icon: form.icon || "star",
          iconColor: "#6366f1",
          type: form.type,
          countries: form.countries,
          linkedDramas: 0,
          status: form.status,
          weight: form.weight,
        };
        setCategories((prev) => [...prev, newCat]);
      }
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat && cat.linkedDramas > 0) {
      toast(`Cannot delete "${cat.name}" because it has ${cat.linkedDramas} linked dramas. Unlink them first.`, "error");
      setDeleteConfirm(null);
      return;
    }
    try {
      await adminApi.deleteCategory(id);
      fetchCategories();
      toast("Category deleted successfully", "success");
    } catch {
      toast("Failed to delete category", "error");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    setDeleteConfirm(null);
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <span className="hover:text-gray-300 cursor-pointer">Home</span>
        <span>/</span>
        <span className="hover:text-gray-300 cursor-pointer">Content</span>
        <span>/</span>
        <span className="text-white">Categories</span>
      </nav>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">Category Management</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(""); }}
            className={`pb-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-500 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <p className="text-sm text-gray-400">Total Count</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalCount}</p>
        </div>
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <p className="text-sm text-gray-400">Active Categories</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{activeCount}</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Healthy
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-[#1a1a2e] p-5">
          <p className="text-sm text-gray-400">Linked Dramas</p>
          <p className="mt-1 text-2xl font-bold text-white">{linkedTotal}</p>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-[#1a1a2e] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#1a1a2e] px-4 py-2 text-sm text-gray-300 hover:bg-[#252540]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
        </button>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
        >
          + Create New
        </button>
      </div>

      {/* Data Table */}
      <div className="rounded-xl bg-[#1a1a2e] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Icon</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
              {activeTab === "regions" && (
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Countries</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Linked Dramas</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Weight</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "regions" ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-white/[0.02] transition">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                      style={{ backgroundColor: `${cat.iconColor}20`, color: cat.iconColor }}
                    >
                      {ICON_MAP[cat.icon] || cat.icon}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {cat.name}
                  </td>
                  {activeTab === "regions" && (
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {cat.countries.slice(0, 4).map((c) => (
                          <span key={c} className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-[11px] font-medium text-indigo-400">{c}</span>
                        ))}
                        {cat.countries.length > 4 && (
                          <span className="rounded-full bg-gray-700/50 px-2 py-0.5 text-[11px] text-gray-400">+{cat.countries.length - 4}</span>
                        )}
                        {cat.countries.length === 0 && <span className="text-xs text-gray-600">—</span>}
                      </div>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {cat.linkedDramas}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        cat.status === "Active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {cat.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {cat.weight}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#1a1a2e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Confirm Delete</h3>
            {(() => {
              const cat = categories.find((c) => c.id === deleteConfirm);
              if (cat && cat.linkedDramas > 0) {
                return (
                  <div className="mt-3">
                    <p className="text-sm text-gray-400">
                      Cannot delete <span className="font-medium text-white">{cat.name}</span> because
                      it has <span className="font-medium text-red-400">{cat.linkedDramas}</span> linked dramas.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Unlink all dramas before deleting.</p>
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div className="mt-3">
                  <p className="text-sm text-gray-400">
                    Are you sure you want to delete <span className="font-medium text-white">{cat?.name}</span>?
                    This action cannot be undone.
                  </p>
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-[#1a1a2e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? "Edit Category" : "Create Category"}
            </h3>

            <div className="mt-5 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Category name"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Icon (emoji or key)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. heart, star, or paste emoji"
                />
              </div>

              {/* Type / Countries */}
              {form.type === "regions" ? (
                <CountrySelect
                  selected={form.countries}
                  onChange={(countries) => setForm({ ...form, countries })}
                />
              ) : (
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Type</label>
                  <input
                    type="text"
                    value={form.type.charAt(0).toUpperCase() + form.type.slice(1)}
                    readOnly
                    className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Status Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">Status</label>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, status: form.status === "Active" ? "Disabled" : "Active" })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    form.status === "Active" ? "bg-indigo-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                      form.status === "Active" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Weight */}
              <div>
                <label className="mb-1 block text-sm text-gray-400">Weight</label>
                <input
                  type="number"
                  min={0}
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-700 bg-[#13131d] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}