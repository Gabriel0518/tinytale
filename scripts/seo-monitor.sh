#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${1:-https://tinytale.top}"
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

TMP_SITEMAP="$(mktemp)"
TMP_REPORT="$(mktemp)"
TMP_ROBOTS="$(mktemp)"

cleanup() {
  rm -f "$TMP_SITEMAP" "$TMP_REPORT" "$TMP_ROBOTS"
}
trap cleanup EXIT

echo "# SEO Monitor Report" >> "$TMP_REPORT"
echo "- site: ${SITE_URL}" >> "$TMP_REPORT"
echo "- generated_at_utc: ${TS}" >> "$TMP_REPORT"
echo >> "$TMP_REPORT"

robots_code="$(curl -s -o /dev/null -w '%{http_code}' "${SITE_URL}/robots.txt")"
sitemap_code="$(curl -s -o /dev/null -w '%{http_code}' "${SITE_URL}/sitemap.xml")"

curl -sS "${SITE_URL}/robots.txt" > "$TMP_ROBOTS"
curl -sS "${SITE_URL}/sitemap.xml" > "$TMP_SITEMAP"

echo "## Core Endpoints" >> "$TMP_REPORT"
echo "- robots_status: ${robots_code}" >> "$TMP_REPORT"
echo "- sitemap_status: ${sitemap_code}" >> "$TMP_REPORT"
if grep -q "Sitemap: ${SITE_URL}/sitemap.xml" "$TMP_ROBOTS"; then
  echo "- robots_has_sitemap: yes" >> "$TMP_REPORT"
else
  echo "- robots_has_sitemap: no" >> "$TMP_REPORT"
fi
echo >> "$TMP_REPORT"

total_urls="$(grep -o '<loc>' "$TMP_SITEMAP" | wc -l | tr -d ' ' || true)"
play_urls="$(grep -o '/play/' "$TMP_SITEMAP" | wc -l | tr -d ' ' || true)"

echo "## Sitemap Stats" >> "$TMP_REPORT"
echo "- total_urls: ${total_urls}" >> "$TMP_REPORT"
echo "- play_urls: ${play_urls}" >> "$TMP_REPORT"

echo -n "- locale_prefixes_found: " >> "$TMP_REPORT"
for l in en es pt id zh ja hi; do
  if grep -q "${SITE_URL}/${l}/" "$TMP_SITEMAP"; then
    echo -n "${l} " >> "$TMP_REPORT"
  fi
done
echo >> "$TMP_REPORT"
echo >> "$TMP_REPORT"

sample_urls_file="$(mktemp)"
grep -o "${SITE_URL}/[^<]*" "$TMP_SITEMAP" | head -n 20 > "$sample_urls_file" || true

echo "## URL Sample Status" >> "$TMP_REPORT"
ok=0
fail=0
while IFS= read -r u; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$u")"
  if [[ "$code" == "200" ]]; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
  fi
  echo "- ${code} ${u}" >> "$TMP_REPORT"
done < "$sample_urls_file"
rm -f "$sample_urls_file"

echo "- sample_ok: ${ok}" >> "$TMP_REPORT"
echo "- sample_fail: ${fail}" >> "$TMP_REPORT"
echo >> "$TMP_REPORT"

canonical_sample="$(grep -o "${SITE_URL}/en/drama/[^<]*" "$TMP_SITEMAP" | grep -v '/play/' | head -n 1 || true)"
play_sample="$(grep -o "${SITE_URL}/en/drama/[^<]*/play/[^<]*" "$TMP_SITEMAP" | head -n 1 || true)"

echo "## Tag Samples" >> "$TMP_REPORT"
for u in "${SITE_URL}/en/browse" "$canonical_sample" "$play_sample" "${SITE_URL}/admin/login"; do
  if [[ -z "$u" ]]; then
    continue
  fi
  body_file="$(mktemp)"
  curl -sS "$u" > "$body_file"
  canon="$(grep -oiE '<link[^>]+rel="canonical"[^>]+href="[^"]+"' "$body_file" | head -n 1 | sed -E 's/.*href="([^"]+)".*/\1/' || true)"
  hreflang_count="$(grep -oiE 'hreflang="[^"]+"' "$body_file" | wc -l | tr -d ' ' || true)"
  robots="$(grep -oiE '<meta[^>]+name="robots"[^>]+content="[^"]+"' "$body_file" | head -n 1 | sed -E 's/.*content="([^"]+)".*/\1/' || true)"
  echo "- url: ${u}" >> "$TMP_REPORT"
  echo "  - canonical: ${canon:-<none>}" >> "$TMP_REPORT"
  echo "  - hreflang_count: ${hreflang_count}" >> "$TMP_REPORT"
  echo "  - robots: ${robots:-<none>}" >> "$TMP_REPORT"
  rm -f "$body_file"
done

echo >> "$TMP_REPORT"
echo "## Search Console" >> "$TMP_REPORT"
echo "- sitemap_submission: manual step (check docs/SEO_SEARCH_CONSOLE_CHECKLIST.md section 0/5.1)" >> "$TMP_REPORT"
echo "- monitoring_actions:" >> "$TMP_REPORT"
echo "  - Check Indexing > Sitemaps for status and discovered pages trend" >> "$TMP_REPORT"
echo "  - Check Pages report for new errors and spikes" >> "$TMP_REPORT"
echo "  - Re-run this script daily after deployments" >> "$TMP_REPORT"

OUT_PATH="/Users/gabriel/tinytale/docs/SEO_MONITOR_REPORT.md"
cp "$TMP_REPORT" "$OUT_PATH"
echo "Report written: ${OUT_PATH}"
