"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";

type SectionKey = "about" | "careers" | "press" | "terms" | "privacy" | "cookies";

const SECTION_META: Record<SectionKey, { label: string; settingKey: string; placeholder: string; defaultHtml: string }> = {
  about: {
    label: "About",
    settingKey: "help_about_html",
    placeholder: "Edit About section content...",
    defaultHtml: "<p>TinyTale is focused on premium short drama storytelling for global audiences.</p>",
  },
  careers: {
    label: "Careers",
    settingKey: "help_careers_html",
    placeholder: "Edit Careers section content...",
    defaultHtml: "<p>We are hiring creators, product designers, and engineers who care deeply about storytelling and user experience.</p>",
  },
  press: {
    label: "Press",
    settingKey: "help_press_html",
    placeholder: "Edit Press section content...",
    defaultHtml: "<p>For press inquiries, interviews, and media kits, contact <a href=\"mailto:press@tinytale.com\">press@tinytale.com</a>.</p>",
  },
  terms: {
    label: "Terms",
    settingKey: "help_terms_html",
    placeholder: "Edit Terms section content...",
    defaultHtml: "<p>Using TinyTale means you agree to our service terms, account usage policies, and payment rules.</p>",
  },
  privacy: {
    label: "Privacy",
    settingKey: "help_privacy_html",
    placeholder: "Edit Privacy section content...",
    defaultHtml: "<p>We protect personal data with clear usage boundaries and industry-standard safeguards.</p>",
  },
  cookies: {
    label: "Cookie Privacy",
    settingKey: "help_cookie_html",
    placeholder: "Edit Cookie Privacy section content...",
    defaultHtml: "<p>We use cookies to keep you signed in, remember preferences, and improve service performance.</p>",
  },
};

function EditorButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-gray-700/50 bg-[#1a1a2e] px-2.5 py-1 text-xs font-medium text-gray-300 transition hover:bg-[#252540]"
    >
      {label}
    </button>
  );
}

function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const applyCommand = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    applyCommand("createLink", url);
  };

  const insertImage = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    applyCommand("insertImage", url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#13131d]">
      <div className="flex flex-wrap gap-2 border-b border-gray-700/50 bg-[#0f0f17] p-3">
        <EditorButton label="B" onClick={() => applyCommand("bold")} />
        <EditorButton label="I" onClick={() => applyCommand("italic")} />
        <EditorButton label="U" onClick={() => applyCommand("underline")} />
        <EditorButton label="H2" onClick={() => applyCommand("formatBlock", "H2")} />
        <EditorButton label="UL" onClick={() => applyCommand("insertUnorderedList")} />
        <EditorButton label="OL" onClick={() => applyCommand("insertOrderedList")} />
        <EditorButton label="Link" onClick={insertLink} />
        <EditorButton label="Image" onClick={insertImage} />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        className="min-h-[320px] w-full bg-[#13131d] p-4 text-sm leading-relaxed text-gray-200 outline-none [&_a]:text-indigo-400 [&_a]:underline [&_img]:max-h-64 [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-700"
        data-placeholder={placeholder || "Type here..."}
      />
    </div>
  );
}

export default function AdminHelpCenterSettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("about");
  const [contents, setContents] = useState<Record<SectionKey, string>>(() => {
    return (Object.keys(SECTION_META) as SectionKey[]).reduce((acc, key) => {
      acc[key] = SECTION_META[key].defaultHtml;
      return acc;
    }, {} as Record<SectionKey, string>);
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await adminApi.getSettings("help_center");
        if (cancelled) return;
        const map = new Map<string, any>((res?.data || []).map((item: any) => [item.key, item.value]));

        setContents((prev) => {
          const next = { ...prev };
          (Object.keys(SECTION_META) as SectionKey[]).forEach((key) => {
            const value = map.get(SECTION_META[key].settingKey);
            if (typeof value === "string" && value.trim()) {
              next[key] = value;
            }
          });
          return next;
        });
      } catch {
        if (!cancelled) setError("Failed to load Help Center content settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeMeta = SECTION_META[activeSection];

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const settingsPayload = (Object.keys(SECTION_META) as SectionKey[]).map((key) => ({
        key: SECTION_META[key].settingKey,
        value: contents[key],
        category: "help_center",
      }));

      await adminApi.saveSettings(settingsPayload);
      setSavedAt(new Date().toLocaleString());
    } catch {
      setError("Failed to save Help Center content.");
    } finally {
      setSaving(false);
    }
  };

  const previewHtml = useMemo(() => contents[activeSection], [activeSection, contents]);

  return (
    <div className="space-y-6 text-gray-200">
      <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Information &amp; Help Center</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage rich-text content for About, Careers, Press, Terms, Privacy, and Cookie Privacy sections.
            </p>
          </div>
          <button
            onClick={saveAll}
            disabled={saving || loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {savedAt && <p className="mt-3 text-xs text-green-400">Saved at {savedAt}</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-3">
          <div className="space-y-1">
            {(Object.keys(SECTION_META) as SectionKey[]).map((key) => {
              const isActive = key === activeSection;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive ? "bg-indigo-600/15 text-indigo-400" : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
                  }`}
                >
                  {SECTION_META[key].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">Edit: {activeMeta.label}</h2>
            <p className="mb-4 text-xs text-gray-500">Setting key: {activeMeta.settingKey}</p>

            {loading ? (
              <div className="rounded-lg border border-dashed border-gray-700/60 bg-[#0f0f17] p-10 text-center text-sm text-gray-500">
                Loading content...
              </div>
            ) : (
              <RichTextEditor
                value={contents[activeSection]}
                onChange={(v) => setContents((prev) => ({ ...prev, [activeSection]: v }))}
                placeholder={activeMeta.placeholder}
              />
            )}
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-6">
            <h3 className="mb-4 text-base font-semibold text-white">Preview</h3>
            <div
              className="rounded-lg border border-gray-700/50 bg-[#0f0f17] p-4 text-sm leading-relaxed text-gray-300 [&_a]:text-indigo-400 [&_a]:underline [&_img]:max-h-64 [&_img]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
