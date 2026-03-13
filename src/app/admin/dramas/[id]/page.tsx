"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type TabId = "basic" | "payment" | "seo" | "translations";

const TRANSLATION_LANGUAGES = [
  { code: "es", label: "Spanish (es)" },
  { code: "pt", label: "Portuguese (pt)" },
  { code: "id", label: "Indonesian (id)" },
  { code: "zh", label: "Chinese (zh)" },
  { code: "ja", label: "Japanese (ja)" },
  { code: "hi", label: "Hindi (hi)" },
  { code: "ko", label: "Korean (ko)" },
  { code: "fr", label: "French (fr)" },
] as const;

export default function DramaDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const [drama, setDrama] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [translationLang, setTranslationLang] = useState<(typeof TRANSLATION_LANGUAGES)[number]["code"]>("es");
  const [translationSaving, setTranslationSaving] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationForm, setTranslationForm] = useState({
    title: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    status: "reviewed" as "auto" | "reviewed" | "published",
  });
  const [form, setForm] = useState({
    title: "", description: "", cover: "", categories: [] as string[],
    actors: [] as string[], director: "", year: 2024, status: "draft",
    dramaMode: "serial" as "serial" | "completed", totalEpisodes: 0,
    seoTitle: "", seoDescription: "", seoKeywords: "",
    isFree: false, defaultUnlockPrice: 100,
  });

  useEffect(() => {
    const fetchDrama = async () => {
      try {
        const res: any = await adminApi.getDrama(id as string);
        if (res.data) {
          setDrama(res.data);
          setForm({
            title: res.data.title || "",
            description: res.data.description || "",
            cover: res.data.cover || "",
            categories: res.data.categories || [],
            actors: res.data.actors || [],
            director: res.data.director || "",
            year: res.data.year || 2024,
            status: res.data.status || "draft",
            dramaMode: res.data.dramaMode || (res.data.isCompleted ? "completed" : "serial"),
            totalEpisodes: res.data.totalEpisodes || 0,
            seoTitle: res.data.seoTitle || "",
            seoDescription: res.data.seoDescription || "",
            seoKeywords: res.data.seoKeywords || "",
            isFree: res.data.isFree || false,
            defaultUnlockPrice: res.data.defaultUnlockPrice || 100,
          });
        }
      } catch (err) {
        console.error("Failed to fetch drama:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDrama();
  }, [id]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const res: any = await adminApi.getDramaTranslations(id as string);
        const items = Array.isArray(res?.data?.translations) ? res.data.translations : [];
        const nextMap: Record<string, any> = {};
        items.forEach((item: any) => {
          if (item?.language) nextMap[item.language] = item;
        });
        setTranslations(nextMap);
      } catch (error) {
        console.error("Failed to fetch drama translations:", error);
      }
    };

    if (id) fetchTranslations();
  }, [id]);

  useEffect(() => {
    const translation = translations[translationLang];
    if (translation) {
      setTranslationForm({
        title: translation.title || "",
        description: translation.description || "",
        seoTitle: translation.seo_title || "",
        seoDescription: translation.seo_description || "",
        status: (translation.status || "reviewed") as "auto" | "reviewed" | "published",
      });
      return;
    }

    setTranslationForm({
      title: form.title || "",
      description: form.description || "",
      seoTitle: form.seoTitle || "",
      seoDescription: form.seoDescription || "",
      status: "reviewed",
    });
  }, [form.description, form.seoDescription, form.seoTitle, form.title, translationLang, translations]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateDrama(id as string, form);
      toast("Saved successfully", "success");
    } catch (err) {
      console.error("Failed to save:", err);
      toast("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!translationForm.title.trim()) {
      toast("Translation title is required", "error");
      return;
    }

    setTranslationSaving(true);
    try {
      await adminApi.saveDramaTranslation(id as string, translationLang, {
        title: translationForm.title,
        description: translationForm.description,
        seoTitle: translationForm.seoTitle,
        seoDescription: translationForm.seoDescription,
        status: translationForm.status,
        translator: "admin",
      });

      const latest: any = await adminApi.getDramaTranslations(id as string);
      const items = Array.isArray(latest?.data?.translations) ? latest.data.translations : [];
      const nextMap: Record<string, any> = {};
      items.forEach((item: any) => {
        if (item?.language) nextMap[item.language] = item;
      });
      setTranslations(nextMap);

      toast(`Saved ${translationLang} translation`, "success");
    } catch (error: any) {
      toast(error?.message || "Failed to save translation", "error");
    } finally {
      setTranslationSaving(false);
    }
  };

  const handleAutoTranslate = async () => {
    setTranslationLoading(true);
    try {
      await adminApi.autoTranslateDrama(id as string, translationLang);
      const latest: any = await adminApi.getDramaTranslations(id as string);
      const items = Array.isArray(latest?.data?.translations) ? latest.data.translations : [];
      const nextMap: Record<string, any> = {};
      items.forEach((item: any) => {
        if (item?.language) nextMap[item.language] = item;
      });
      setTranslations(nextMap);
      toast(`Auto translated to ${translationLang}`, "success");
    } catch (error: any) {
      toast(error?.message || "Auto translation failed", "error");
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleDeleteTranslation = async () => {
    if (!translations[translationLang]) {
      toast("No translation to delete for this language", "error");
      return;
    }
    const confirmed = await confirmDialog({
      title: "Delete Translation",
      message: `Delete ${translationLang} translation?`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!confirmed) return;

    setTranslationSaving(true);
    try {
      await adminApi.deleteDramaTranslation(id as string, translationLang);
      const nextMap = { ...translations };
      delete nextMap[translationLang];
      setTranslations(nextMap);
      toast(`Deleted ${translationLang} translation`, "success");
    } catch (error: any) {
      toast(error?.message || "Failed to delete translation", "error");
    } finally {
      setTranslationSaving(false);
    }
  };

  const tabs = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "payment" as const, label: "Payment Settings" },
    { id: "seo" as const, label: "SEO & Publish" },
    { id: "translations" as const, label: "Translations" },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-[#1a1a2e]" />
        <div className="h-96 rounded-xl bg-[#1a1a2e]" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/dramas" className="text-sm text-gray-400 hover:text-gray-300">
            ← Back to Dramas
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-200">
            {drama?.title || "New Drama"}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/dramas/${id}/episodes`}
            className="rounded-lg border border-gray-700/50 bg-[#13131d] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a2e]"
          >
            Manage Episodes
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === "basic" && (
        <div className="rounded-xl bg-[#13131d] p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Cover URL</label>
              <input
                type="text"
                value={form.cover}
                onChange={(e) => setForm({ ...form, cover: e.target.value })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Director</label>
              <input
                type="text"
                value={form.director}
                onChange={(e) => setForm({ ...form, director: e.target.value })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Total Episodes</label>
              <input
                type="number"
                value={form.totalEpisodes}
                onChange={(e) => setForm({ ...form, totalEpisodes: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Drama Mode</label>
              <select
                value={form.dramaMode}
                onChange={(e) => setForm({ ...form, dramaMode: e.target.value as "serial" | "completed" })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="serial">Serial (Ongoing)</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Payment Settings Tab */}
      {activeTab === "payment" && (
        <div className="rounded-xl bg-[#13131d] p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-200">Payment Settings</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
                className="h-4 w-4 rounded border-gray-600 text-indigo-600"
              />
              <label className="text-sm font-medium text-gray-300">Free Drama (all episodes free)</label>
            </div>
            {!form.isFree && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Default Unlock Price (coins per episode)
                </label>
                <input
                  type="number"
                  value={form.defaultUnlockPrice}
                  onChange={(e) => setForm({ ...form, defaultUnlockPrice: Number(e.target.value) })}
                  className="w-64 rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-400">Individual episode prices can be set in Episode Management</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEO & Publish Tab */}
      {activeTab === "seo" && (
        <div className="rounded-xl bg-[#13131d] p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-200">SEO Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">SEO Title</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                placeholder={form.title}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">SEO Description</label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                rows={3}
                placeholder={form.description}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Keywords (comma separated)</label>
              <input
                type="text"
                value={form.seoKeywords}
                onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Translations Tab */}
      {activeTab === "translations" && (
        <div className="rounded-xl bg-[#13131d] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-200">Drama Copy Translations</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoTranslate}
                disabled={translationLoading || translationSaving}
                className="rounded-lg border border-indigo-500/60 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {translationLoading ? "Translating..." : "Auto Translate"}
              </button>
              <button
                onClick={handleDeleteTranslation}
                disabled={translationSaving || translationLoading}
                className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
              <button
                onClick={handleSaveTranslation}
                disabled={translationSaving || translationLoading}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {translationSaving ? "Saving..." : "Save Translation"}
              </button>
            </div>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Language</label>
              <select
                value={translationLang}
                onChange={(e) => setTranslationLang(e.target.value as any)}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TRANSLATION_LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Status</label>
              <select
                value={translationForm.status}
                onChange={(e) => setTranslationForm({ ...translationForm, status: e.target.value as any })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="auto">Auto</option>
                <option value="reviewed">Reviewed</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-3 py-2">
              <p className="text-xs text-gray-400">Current version</p>
              <p className="text-sm font-medium text-gray-200">
                {translations[translationLang]?.version ? `v${translations[translationLang].version}` : "Not created"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Title</label>
              <input
                type="text"
                value={translationForm.title}
                onChange={(e) => setTranslationForm({ ...translationForm, title: e.target.value })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={translationForm.description}
                onChange={(e) => setTranslationForm({ ...translationForm, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">SEO Title</label>
              <input
                type="text"
                value={translationForm.seoTitle}
                onChange={(e) => setTranslationForm({ ...translationForm, seoTitle: e.target.value })}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">SEO Description</label>
              <textarea
                value={translationForm.seoDescription}
                onChange={(e) => setTranslationForm({ ...translationForm, seoDescription: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-700/50 bg-[#1a1a2e] px-4 py-2.5 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
