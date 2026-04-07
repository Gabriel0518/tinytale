#!/usr/bin/env bash

set -euo pipefail

ADB_BIN="${ADB_BIN:-/Users/gabriel/Library/Android/sdk/platform-tools/adb}"
APP_ID="${APP_ID:-top.tinytale.app}"
OUTPUT_DIR="${OUTPUT_DIR:-/Users/gabriel/tinytale/.codex-assets/verification}"
STEP_WAIT_SECONDS="${STEP_WAIT_SECONDS:-4}"
FORCE_STOP_WAIT_SECONDS="${FORCE_STOP_WAIT_SECONDS:-2}"
SMOKE_API_BASE_URL="${SMOKE_API_BASE_URL:-https://api.tinytale.top}"
SMOKE_DRAMA_ID="${SMOKE_DRAMA_ID:-}"
SMOKE_EPISODE_ID="${SMOKE_EPISODE_ID:-}"

usage() {
  cat <<EOF
Usage: $0 [device-serial]

Environment overrides:
  ADB_BIN            adb binary path
  APP_ID             Android package id (default: top.tinytale.app)
  OUTPUT_DIR         Output folder for logs/screenshots
  STEP_WAIT_SECONDS  Wait after each deep-link launch (default: 4)
  FORCE_STOP_WAIT_SECONDS  Wait after force-stop before launch (default: 2)
  SMOKE_API_BASE_URL API base URL for resolving real smoke fixtures
  SMOKE_DRAMA_ID     Optional explicit drama id override
  SMOKE_EPISODE_ID   Optional explicit episode id override
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

resolve_device() {
  if [[ $# -gt 0 && -n "${1:-}" ]]; then
    echo "$1"
    return 0
  fi

  local devices
  devices="$("$ADB_BIN" devices | awk -F '\t' 'NR>1 && $2=="device" {print $1}')"
  local count
  count="$(echo "$devices" | awk 'NF {count++} END {print count+0}')"

  if [[ "$count" -eq 1 ]]; then
    echo "$devices"
    return 0
  fi

  if [[ "$count" -eq 0 ]]; then
    echo "No adb device connected." >&2
  else
    echo "Multiple adb devices detected. Pass a serial explicitly." >&2
    echo "$devices" >&2
  fi
  exit 1
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's#[^a-z0-9]+#-#g; s#(^-|-$)##g'
}

capture_step() {
  local device_serial="$1"
  local run_dir="$2"
  local slug="$3"

  "$ADB_BIN" -s "$device_serial" shell screencap -p "/sdcard/${slug}.png"
  "$ADB_BIN" -s "$device_serial" pull "/sdcard/${slug}.png" "$run_dir/${slug}.png" >/dev/null
  "$ADB_BIN" -s "$device_serial" shell rm "/sdcard/${slug}.png" >/dev/null 2>&1 || true
  "$ADB_BIN" -s "$device_serial" shell dumpsys activity activities > "$run_dir/${slug}-activities.txt"
  "$ADB_BIN" -s "$device_serial" shell dumpsys window windows > "$run_dir/${slug}-windows.txt"
  "$ADB_BIN" -s "$device_serial" exec-out uiautomator dump /dev/tty > "$run_dir/${slug}-ui.xml" || true
}

launch_url() {
  local device_serial="$1"
  local url="$2"

  "$ADB_BIN" -s "$device_serial" shell am start -W \
    -S \
    -a android.intent.action.VIEW \
    -c android.intent.category.BROWSABLE \
    -d "$url" \
    "$APP_ID"
}

reset_app_state() {
  local device_serial="$1"

  "$ADB_BIN" -s "$device_serial" shell am force-stop "$APP_ID"
  sleep "$FORCE_STOP_WAIT_SECONDS"
}

resolve_fixture_ids() {
  if [[ -n "$SMOKE_DRAMA_ID" && -n "$SMOKE_EPISODE_ID" ]]; then
    echo "$SMOKE_DRAMA_ID|$SMOKE_EPISODE_ID"
    return 0
  fi

  SMOKE_API_BASE_URL="$SMOKE_API_BASE_URL" node <<'EOF'
const apiBaseUrl = (process.env.SMOKE_API_BASE_URL || 'https://api.tinytale.top').replace(/\/+$/, '')

async function main() {
  const listResponse = await fetch(`${apiBaseUrl}/api/dramas?limit=5&lang=en`)
  const listPayload = await listResponse.json()
  const dramas = listPayload?.data?.dramas ?? []

  for (const drama of dramas) {
    const detailResponse = await fetch(`${apiBaseUrl}/api/dramas/${drama._id}?lang=en`)
    const detailPayload = await detailResponse.json()
    const episodes = detailPayload?.data?.episodes ?? []

    if (episodes.length > 0) {
      process.stdout.write(`${drama._id}|${episodes[0]._id}`)
      return
    }
  }

  process.exit(1)
}

main().catch(() => {
  process.exit(1)
})
EOF
}

DEVICE_SERIAL="$(resolve_device "${1:-}")"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
RUN_DIR="$OUTPUT_DIR/android-deeplink-smoke-$TIMESTAMP"

FIXTURE_IDS="$(resolve_fixture_ids 2>/dev/null || true)"
FIXTURE_DRAMA_ID="${FIXTURE_IDS%%|*}"
FIXTURE_EPISODE_ID="${FIXTURE_IDS#*|}"

if [[ -z "$FIXTURE_DRAMA_ID" || -z "$FIXTURE_EPISODE_ID" || "$FIXTURE_DRAMA_ID" == "$FIXTURE_IDS" ]]; then
  FIXTURE_DRAMA_ID="123"
  FIXTURE_EPISODE_ID="456"
fi

mkdir -p "$RUN_DIR"

declare -a CASE_NAMES=(
  "play-route"
  "browse-route"
  "web-about"
  "custom-scheme-drama"
)

declare -a CASE_URLS=(
  "https://tinytale.top/drama/${FIXTURE_DRAMA_ID}/play/${FIXTURE_EPISODE_ID}"
  "https://tinytale.top/browse"
  "https://tinytale.top/about"
  "top.tinytale.app://drama/${FIXTURE_DRAMA_ID}"
)

echo "Using device: $DEVICE_SERIAL"
echo "Artifacts: $RUN_DIR"

reset_app_state "$DEVICE_SERIAL"

{
  echo "# Android Deep Link Smoke"
  echo
  echo "- Device: $DEVICE_SERIAL"
  echo "- Timestamp: $TIMESTAMP"
  echo "- Fixture drama id: $FIXTURE_DRAMA_ID"
  echo "- Fixture episode id: $FIXTURE_EPISODE_ID"
  echo
  echo "| Case | URL | Launch Output | Logcat | Screenshot | Activities | Windows | UI Dump |"
  echo "|---|---|---|---|---|---|---|---|"
} > "$RUN_DIR/summary.md"

for i in "${!CASE_NAMES[@]}"; do
  name="${CASE_NAMES[$i]}"
  url="${CASE_URLS[$i]}"
  slug="$(slugify "$name")"

  echo "Launching [$name] $url"
  reset_app_state "$DEVICE_SERIAL"
  "$ADB_BIN" -s "$DEVICE_SERIAL" logcat -c
  launch_url "$DEVICE_SERIAL" "$url" > "$RUN_DIR/${slug}-launch.txt"
  sleep "$STEP_WAIT_SECONDS"
  capture_step "$DEVICE_SERIAL" "$RUN_DIR" "$slug"
  "$ADB_BIN" -s "$DEVICE_SERIAL" logcat -d > "$RUN_DIR/${slug}-logcat.txt"

  {
    echo "| $name | \`$url\` | ${slug}-launch.txt | ${slug}-logcat.txt | ${slug}.png | ${slug}-activities.txt | ${slug}-windows.txt | ${slug}-ui.xml |"
  } >> "$RUN_DIR/summary.md"
done

reset_app_state "$DEVICE_SERIAL"

echo
echo "Deep-link smoke run complete."
echo "Summary: $RUN_DIR/summary.md"
