"use client";

import { useEffect, useMemo, useRef } from "react";
import type { SupportedLocale } from "@/lib/i18n";
import translationMap from "../_lib/creator-translations.generated.json";

type TranslationTable = Partial<Record<SupportedLocale, Record<string, string>>>;

const TRANSLATIONS = translationMap as TranslationTable;

const TRANSLATION_OVERRIDES: Partial<Record<SupportedLocale, Record<string, string>>> = {
  zh: {
    "Creator Center": "创作者中心",
    "Creator Account": "创作者账号",
    Dashboard: "仪表盘",
    Dramas: "短剧",
    Analytics: "数据分析",
    Contract: "合约",
    Settlements: "结算",
    Tickets: "工单",
    Notifications: "通知",
    Settings: "设置",
    "New Drama": "新建短剧",
    "Apply to Create": "申请入驻",
    "Support Tickets": "支持工单",
    "Settlement Center": "结算中心",
    "Creator Onboarding": "创作者入驻",
    "Basic Info": "基础信息",
    "Creative Profile": "创作资料",
    "Your stories deserve an audience and a paycheck.": "你的故事值得被看见，也值得赚钱。",
    "Publish premium short dramas on TinyTale and turn strong storytelling into real revenue with a platform built for vertical series.":
      "在 TinyTale 发布高品质短剧，用专为竖屏剧集打造的平台把好故事变成真实收入。",
  },
};

const TEXT_NODE_ORIGINALS = new WeakMap<Text, string>();
const ELEMENT_ATTR_ORIGINALS = new WeakMap<Element, Partial<Record<"placeholder" | "title" | "aria-label" | "value", string>>>();

const TEMPLATE_RULES: Array<{ pattern: RegExp; template: string }> = [
  { pattern: /^Modified (\d+) hours ago$/i, template: "Modified __ARG_0__ hours ago" },
  { pattern: /^Updated (\d+) days ago$/i, template: "Updated __ARG_0__ days ago" },
  { pattern: /^Updated ([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})$/i, template: "Updated __ARG_0__" },
  { pattern: /^(\d+)h ago$/i, template: "__ARG_0__h ago" },
  { pattern: /^(\d+)d ago$/i, template: "__ARG_0__d ago" },
  { pattern: /^Showing (\d+) to (\d+) of ([\d,]+) entries$/i, template: "Showing __ARG_0__ to __ARG_1__ of __ARG_2__ entries" },
  { pattern: /^Progress:\s*(\d+)%$/i, template: "Progress: __ARG_0__%" },
  { pattern: /^Uploading (\d+)%$/i, template: "Uploading __ARG_0__%" },
  { pattern: /^Uploading source (\d+)%$/i, template: "Uploading source __ARG_0__%" },
  { pattern: /^Step (\d+) of (\d+)$/i, template: "Step __ARG_0__ of __ARG_1__" },
  { pattern: /^Episode (\d+)$/i, template: "Episode __ARG_0__" },
  { pattern: /^Delete episode (\d+)$/i, template: "Delete episode __ARG_0__" },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translateExact(value: string, locale: SupportedLocale) {
  if (locale === "en" || !value) return value;
  return TRANSLATION_OVERRIDES[locale]?.[value] || TRANSLATIONS[locale]?.[value] || value;
}

function translateTemplate(source: string, locale: SupportedLocale) {
  const trimmed = source.trim();
  if (!trimmed || locale === "en") return source;

  for (const rule of TEMPLATE_RULES) {
    const match = trimmed.match(rule.pattern);
    if (!match) continue;

    const translatedTemplate = translateExact(rule.template, locale);
    if (!translatedTemplate || translatedTemplate === rule.template) continue;

    const next = translatedTemplate.replace(/__ARG_(\d+)__/g, (_, index) => match[Number(index) + 1] || "");
    return preserveWhitespace(source, next);
  }

  return source;
}

function translateText(value: string, locale: SupportedLocale) {
  if (locale === "en" || !value) return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const exact = translateExact(trimmed, locale);
  if (exact !== trimmed) {
    return preserveWhitespace(value, exact);
  }

  return translateTemplate(value, locale);
}

function shouldSkipTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest("[data-creator-i18n-controlled='true']")) return true;

  const tagName = parent.tagName;
  return (
    tagName === "SCRIPT" ||
    tagName === "STYLE" ||
    tagName === "NOSCRIPT" ||
    tagName === "TEXTAREA" ||
    tagName === "CODE" ||
    tagName === "PRE" ||
    tagName === "SVG" ||
    tagName === "PATH"
  );
}

function translateTextNode(node: Text, locale: SupportedLocale) {
  if (shouldSkipTextNode(node)) return;

  const current = node.nodeValue || "";
  if (!TEXT_NODE_ORIGINALS.has(node)) {
    TEXT_NODE_ORIGINALS.set(node, current);
  }

  const original = TEXT_NODE_ORIGINALS.get(node) || current;
  const next = translateText(original, locale);
  if (next !== current) {
    node.nodeValue = next;
  }
}

function translateElementAttributes(element: Element, locale: SupportedLocale) {
  if (element.closest("[data-creator-i18n-controlled='true']")) return;

  const attrNames: Array<"placeholder" | "title" | "aria-label"> = ["placeholder", "title", "aria-label"];
  const originals = ELEMENT_ATTR_ORIGINALS.get(element) || {};

  attrNames.forEach((attrName) => {
    const attrValue = element.getAttribute(attrName);
    if (attrValue !== null && originals[attrName] === undefined) {
      originals[attrName] = attrValue;
    }

    if (originals[attrName] !== undefined) {
      const next = translateText(originals[attrName] || "", locale);
      if (element.getAttribute(attrName) !== next) {
        element.setAttribute(attrName, next);
      }
    }
  });

  if (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)) {
    if (originals.value === undefined) {
      originals.value = element.value;
    }

    const nextValue = translateText(originals.value || "", locale);
    if (element.value !== nextValue) {
      element.value = nextValue;
    }
  }

  ELEMENT_ATTR_ORIGINALS.set(element, originals);
}

function applyTranslations(root: ParentNode, locale: SupportedLocale) {
  if (!isBrowser()) return;

  if (root instanceof Element) {
    translateElementAttributes(root, locale);
  }

  const elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let currentElement = elementWalker.currentNode as Element | null;
  while (currentElement) {
    translateElementAttributes(currentElement, locale);
    currentElement = elementWalker.nextNode() as Element | null;
  }

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentText = textWalker.nextNode() as Text | null;
  while (currentText) {
    translateTextNode(currentText, locale);
    currentText = textWalker.nextNode() as Text | null;
  }
}

export default function CreatorI18nProvider({
  locale,
  children,
}: {
  locale: SupportedLocale;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current || !isBrowser()) return undefined;

    let frame = 0;
    const root = rootRef.current;

    const scheduleTranslate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyTranslations(root, locale);
      });
    };

    scheduleTranslate();

    const observer = new MutationObserver(() => {
      scheduleTranslate();
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label", "value"],
    });

    return () => {
      observer.disconnect();
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [locale]);

  const lang = useMemo(() => {
    switch (locale) {
      case "zh":
        return "zh-CN";
      case "ja":
        return "ja-JP";
      case "es":
        return "es-ES";
      case "pt":
        return "pt-BR";
      case "hi":
        return "hi-IN";
      case "id":
        return "id-ID";
      case "ko":
        return "ko-KR";
      case "fr":
        return "fr-FR";
      default:
        return "en";
    }
  }, [locale]);

  return (
    <div ref={rootRef} data-creator-i18n-root lang={lang}>
      {children}
    </div>
  );
}
