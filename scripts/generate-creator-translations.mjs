#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, "src/app/creator/_lib/creator-translations.generated.json");
const TARGET_LOCALES = ["zh", "ja", "es", "pt", "hi", "id", "ko", "fr"];
const CONCURRENCY = 10;
const DRY_RUN = process.argv.includes("--dry-run");

const EXTRA_PHRASES = [
  "Modified __ARG_0__ hours ago",
  "Updated __ARG_0__ days ago",
  "Updated __ARG_0__",
  "__ARG_0__h ago",
  "__ARG_0__d ago",
  "Showing __ARG_0__ to __ARG_1__ of __ARG_2__ entries",
  "Progress: __ARG_0__%",
  "Uploading __ARG_0__%",
  "Uploading source __ARG_0__%",
  "Step __ARG_0__ of __ARG_1__",
  "Episode __ARG_0__",
  "Delete episode __ARG_0__",
];

function listSourceFiles() {
  const output = execSync("rg --files src/app/creator src/lib/creator.ts", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();

  if (!output) return [];
  return Array.from(
    new Set(
      output
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => !item.endsWith("creator-translations.generated.json"))
    )
  );
}

function normalizeTemplateLiteral(content) {
  let index = 0;
  return content.replace(/\$\{[^}]*\}/g, () => `__ARG_${index++}__`);
}

function unescapeSimple(content) {
  return content
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function looksLikeUtilityClass(text) {
  const utilityTokenPattern =
    /\b(?:absolute|relative|fixed|sticky|flex|grid|inline-flex|block|hidden|items-|justify-|content-|rounded|bg-|text-|border|outline|ring|shadow|hover:|focus:|sm:|md:|lg:|xl:|2xl:|px-|py-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-|mx-|my-|w-|h-|min-|max-|gap-|space-|font-|leading-|tracking-|overflow-|cursor-|opacity-|animate-|translate-|scale-|rotate-|object-|select-|pointer-events-|z-|left-|right-|top-|bottom-)\S*/g;
  const matches = text.match(utilityTokenPattern) || [];
  return matches.length >= 3;
}

function shouldKeepPhrase(phrase) {
  const text = phrase.trim();
  if (!text) return false;
  if (text.length < 2 || text.length > 320) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (!/^[\x00-\x7F]+$/.test(text)) return false;
  if (/^(en|zh|ja|es|pt|hi|id|ko|fr)$/i.test(text)) return false;
  if (text.startsWith("http://") || text.startsWith("https://")) return false;
  if (text.startsWith("use client")) return false;
  if (text.startsWith("@/") || text.startsWith("./") || text.startsWith("../")) return false;
  if (text.startsWith("#")) return false;
  if (/^\/[A-Za-z0-9/_\-[\].]*$/.test(text)) return false;
  if (/[?&][A-Za-z0-9_-]+=/.test(text) && !text.includes(" ")) return false;
  if (/^[A-Za-z0-9_.-]+$/.test(text) && !text.includes(" ")) return false;
  if (/^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]+$/.test(text)) return false;
  if (looksLikeUtilityClass(text)) return false;
  if (/[{}[\]]/.test(text) && !/__ARG_\d+__/.test(text)) return false;
  if (text.includes("=>") || text.includes("?.") || text.includes("&&") || text.includes("||")) return false;
  if (text.includes("${") || text.includes("}") || text.includes("]")) return false;
  if (/\.(jpg|jpeg|png|webp|pdf|txt|csv|json|zip)(,|$)/i.test(text) && !text.includes(" ")) return false;
  const classLikeTokens = text.split(/\s+/).filter(Boolean);
  if (
    classLikeTokens.length >= 2 &&
    classLikeTokens.every((token) => /^[a-z0-9:/.[\]_%#()-]+$/i.test(token)) &&
    classLikeTokens.some((token) => /[-:/]/.test(token)) &&
    !/[A-Z]/.test(text)
  ) {
    return false;
  }
  if (text.length > 36 && !text.includes(" ")) return false;

  const letterCount = (text.match(/[A-Za-z]/g) || []).length;
  if (letterCount / text.length < 0.42) return false;

  return true;
}

function extractPhrases(content) {
  const set = new Set();

  const doubleQuoteRegex = /"((?:\\.|[^"\\])*)"/g;
  const singleQuoteRegex = /'((?:\\.|[^'\\])*)'/g;
  const templateRegex = /`((?:\\.|[^`\\])*)`/g;
  const jsxTextRegex = />\s*([^<>{][^<>]{0,320}?)\s*</g;

  let match;
  while ((match = doubleQuoteRegex.exec(content)) !== null) {
    const value = unescapeSimple(match[1]);
    if (shouldKeepPhrase(value)) set.add(value.trim());
  }
  while ((match = singleQuoteRegex.exec(content)) !== null) {
    const value = unescapeSimple(match[1]);
    if (shouldKeepPhrase(value)) set.add(value.trim());
  }
  while ((match = templateRegex.exec(content)) !== null) {
    const normalized = normalizeTemplateLiteral(unescapeSimple(match[1]));
    if (shouldKeepPhrase(normalized)) set.add(normalized.trim());
  }
  while ((match = jsxTextRegex.exec(content)) !== null) {
    const value = unescapeSimple(match[1]).replace(/\s+/g, " ").trim();
    if (shouldKeepPhrase(value)) set.add(value);
  }

  return set;
}

async function loadExistingMap() {
  try {
    const raw = await fs.readFile(OUTPUT_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(TARGET_LOCALES.map((locale) => [locale, {}]));
  }
}

async function translatePhrase(text, targetLocale) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLocale}&dt=t&q=${encodeURIComponent(text)}`;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const translated = Array.isArray(payload?.[0])
        ? payload[0].map((item) => item?.[0] || "").join("")
        : "";

      if (translated) return translated;
    } catch {
      if (attempt === 4) return text;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  return text;
}

async function runWithConcurrency(tasks, workerCount) {
  const queue = [...tasks];
  let completed = 0;
  const total = queue.length;

  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) continue;

      await task();
      completed += 1;

      if (completed % 100 === 0 || completed === total) {
        console.log(`Progress: ${completed}/${total}`);
      }
    }
  });

  await Promise.all(workers);
}

async function main() {
  const files = listSourceFiles();
  console.log(`Scanning files: ${files.length}`);

  const phraseSet = new Set(EXTRA_PHRASES);

  for (const relativeFile of files) {
    const fullPath = path.join(ROOT, relativeFile);
    const content = await fs.readFile(fullPath, "utf8");
    const phrases = extractPhrases(content);
    for (const phrase of phrases) {
      phraseSet.add(phrase);
    }
  }

  const phrases = Array.from(phraseSet).sort((a, b) => a.localeCompare(b));
  console.log(`Extracted creator phrases: ${phrases.length}`);

  const existingMap = await loadExistingMap();
  const result = Object.fromEntries(
    TARGET_LOCALES.map((locale) => [locale, { ...(existingMap?.[locale] || {}) }])
  );

  const tasks = [];
  for (const phrase of phrases) {
    for (const locale of TARGET_LOCALES) {
      if (result[locale]?.[phrase]) continue;
      tasks.push(async () => {
        const translated = await translatePhrase(phrase, locale);
        result[locale][phrase] = translated;
      });
    }
  }

  console.log(`Missing creator translations: ${tasks.length}`);
  if (DRY_RUN) return;

  await runWithConcurrency(tasks, CONCURRENCY);
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`Phrases: ${phrases.length}, translated pairs: ${tasks.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
