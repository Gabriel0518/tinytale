#!/usr/bin/env bash

set -euo pipefail

ADB_BIN="${ADB_BIN:-/Users/gabriel/Library/Android/sdk/platform-tools/adb}"
APP_ID="${APP_ID:-top.tinytale.app}"
APP_ACTIVITY="${APP_ACTIVITY:-top.tinytale.app/.MainActivity}"
DEBUG_PUSH_EXTRA_KEY="${DEBUG_PUSH_EXTRA_KEY:-tinytaleDebugPushPayload}"
DEBUG_PUSH_ROUTE_KEY="${DEBUG_PUSH_ROUTE_KEY:-tinytaleDebugPushRoute}"
DEBUG_PUSH_URL_KEY="${DEBUG_PUSH_URL_KEY:-tinytaleDebugPushUrl}"
OUTPUT_DIR="${OUTPUT_DIR:-/Users/gabriel/tinytale/.codex-assets/verification}"
STEP_WAIT_SECONDS="${STEP_WAIT_SECONDS:-4}"
FORCE_STOP_WAIT_SECONDS="${FORCE_STOP_WAIT_SECONDS:-2}"
BACKGROUND_WAIT_SECONDS="${BACKGROUND_WAIT_SECONDS:-2}"
SMOKE_API_BASE_URL="${SMOKE_API_BASE_URL:-https://api.tinytale.top}"
SMOKE_DRAMA_ID="${SMOKE_DRAMA_ID:-}"

usage() {
  cat <<EOF
Usage: $0 [device-serial]

Environment overrides:
  ADB_BIN                 adb binary path
  APP_ID                  Android package id (default: top.tinytale.app)
  APP_ACTIVITY            Android activity used for explicit launches
  DEBUG_PUSH_EXTRA_KEY    Intent extra key for injected push payload
  DEBUG_PUSH_ROUTE_KEY    Intent extra key for injected push route
  DEBUG_PUSH_URL_KEY      Intent extra key for injected push url
  OUTPUT_DIR              Output folder for logs/screenshots
  STEP_WAIT_SECONDS       Wait after each injected payload (default: 4)
  FORCE_STOP_WAIT_SECONDS Wait after force-stop before launch (default: 2)
  BACKGROUND_WAIT_SECONDS Wait after sending app to background (default: 2)
  SMOKE_API_BASE_URL      API base URL for resolving real smoke fixtures
  SMOKE_DRAMA_ID          Optional explicit drama id override
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

reset_app_state() {
  local device_serial="$1"

  "$ADB_BIN" -s "$device_serial" shell am force-stop "$APP_ID"
  sleep "$FORCE_STOP_WAIT_SECONDS"
}

launch_main_activity() {
  local device_serial="$1"

  "$ADB_BIN" -s "$device_serial" shell am start -W \
    -a android.intent.action.MAIN \
    -c android.intent.category.LAUNCHER \
    -n "$APP_ACTIVITY"
}

inject_debug_push() {
  local device_serial="$1"
  local extra_key="$2"
  local extra_value="$3"
  local raw_payload="${4:-}"
  local -a cmd=(
    "$ADB_BIN" -s "$device_serial" shell am start -W
    -n "$APP_ACTIVITY"
    --es "$extra_key" "$extra_value"
  )

  if [[ -n "$raw_payload" ]]; then
    cmd+=(--es "$DEBUG_PUSH_EXTRA_KEY" "$raw_payload")
  fi

  "${cmd[@]}"
}

background_app() {
  local device_serial="$1"

  "$ADB_BIN" -s "$device_serial" shell input keyevent KEYCODE_HOME
  sleep "$BACKGROUND_WAIT_SECONDS"
}

resolve_fixture_drama_id() {
  if [[ -n "$SMOKE_DRAMA_ID" ]]; then
    echo "$SMOKE_DRAMA_ID"
    return 0
  fi

  SMOKE_API_BASE_URL="$SMOKE_API_BASE_URL" node <<'EOF'
const apiBaseUrl = (process.env.SMOKE_API_BASE_URL || 'https://api.tinytale.top').replace(/\/+$/, '')

async function main() {
  const listResponse = await fetch(`${apiBaseUrl}/api/dramas?limit=5&lang=en`)
  const listPayload = await listResponse.json()
  const dramas = listPayload?.data?.dramas ?? []

  if (dramas.length > 0) {
    process.stdout.write(String(dramas[0]._id))
    return
  }

  process.exit(1)
}

main().catch(() => {
  process.exit(1)
})
EOF
}

run_cold_case() {
  local device_serial="$1"
  local run_dir="$2"
  local case_name="$3"
  local payload_display="$4"
  local extra_key="$5"
  local extra_value="$6"
  local slug
  slug="$(slugify "$case_name")"

  echo "Injecting [$case_name] $payload_display"
  reset_app_state "$device_serial"
  "$ADB_BIN" -s "$device_serial" logcat -c
  inject_debug_push "$device_serial" "$extra_key" "$extra_value" "$payload_display" > "$run_dir/${slug}-launch.txt"
  sleep "$STEP_WAIT_SECONDS"
  capture_step "$device_serial" "$run_dir" "$slug"
  "$ADB_BIN" -s "$device_serial" logcat -d > "$run_dir/${slug}-logcat.txt"

  echo "| $case_name | cold | \`$payload_display\` | ${slug}-launch.txt | ${slug}-logcat.txt | ${slug}.png | ${slug}-activities.txt | ${slug}-windows.txt | ${slug}-ui.xml |" >> "$run_dir/summary.md"
}

run_warm_case() {
  local device_serial="$1"
  local run_dir="$2"
  local case_name="$3"
  local payload_display="$4"
  local extra_key="$5"
  local extra_value="$6"
  local slug
  slug="$(slugify "$case_name")"

  echo "Injecting [$case_name] $payload_display"
  reset_app_state "$device_serial"
  launch_main_activity "$device_serial" > "$run_dir/${slug}-bootstrap.txt"
  sleep "$STEP_WAIT_SECONDS"
  background_app "$device_serial"
  "$ADB_BIN" -s "$device_serial" logcat -c
  inject_debug_push "$device_serial" "$extra_key" "$extra_value" "$payload_display" > "$run_dir/${slug}-launch.txt"
  sleep "$STEP_WAIT_SECONDS"
  capture_step "$device_serial" "$run_dir" "$slug"
  "$ADB_BIN" -s "$device_serial" logcat -d > "$run_dir/${slug}-logcat.txt"

  echo "| $case_name | warm | \`$payload_display\` | ${slug}-launch.txt | ${slug}-logcat.txt | ${slug}.png | ${slug}-activities.txt | ${slug}-windows.txt | ${slug}-ui.xml |" >> "$run_dir/summary.md"
}

DEVICE_SERIAL="$(resolve_device "${1:-}")"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
RUN_DIR="$OUTPUT_DIR/android-push-route-smoke-$TIMESTAMP"
FIXTURE_DRAMA_ID="$(resolve_fixture_drama_id 2>/dev/null || true)"

if [[ -z "$FIXTURE_DRAMA_ID" ]]; then
  FIXTURE_DRAMA_ID="123"
fi

mkdir -p "$RUN_DIR"

echo "Using device: $DEVICE_SERIAL"
echo "Artifacts: $RUN_DIR"

{
  echo "# Android Push Route Smoke"
  echo
  echo "- Device: $DEVICE_SERIAL"
  echo "- Timestamp: $TIMESTAMP"
  echo "- Fixture drama id: $FIXTURE_DRAMA_ID"
  echo
  echo "| Case | Mode | Payload | Launch Output | Logcat | Screenshot | Activities | Windows | UI Dump |"
  echo "|---|---|---|---|---|---|---|---|---|"
} > "$RUN_DIR/summary.md"

run_cold_case "$DEVICE_SERIAL" "$RUN_DIR" "push-drama-cold" "{\"route\":\"/drama/${FIXTURE_DRAMA_ID}\"}" "$DEBUG_PUSH_ROUTE_KEY" "/drama/${FIXTURE_DRAMA_ID}"
run_cold_case "$DEVICE_SERIAL" "$RUN_DIR" "push-notifications-cold" '{"route":"/user/notifications"}' "$DEBUG_PUSH_ROUTE_KEY" "/user/notifications"
run_cold_case "$DEVICE_SERIAL" "$RUN_DIR" "push-about-cold" '{"url":"https://tinytale.top/about"}' "$DEBUG_PUSH_URL_KEY" "https://tinytale.top/about"
run_warm_case "$DEVICE_SERIAL" "$RUN_DIR" "push-drama-warm" "{\"route\":\"/drama/${FIXTURE_DRAMA_ID}\"}" "$DEBUG_PUSH_ROUTE_KEY" "/drama/${FIXTURE_DRAMA_ID}"
run_warm_case "$DEVICE_SERIAL" "$RUN_DIR" "push-about-warm" '{"url":"https://tinytale.top/about"}' "$DEBUG_PUSH_URL_KEY" "https://tinytale.top/about"

reset_app_state "$DEVICE_SERIAL"

echo
echo "Push route smoke run complete."
echo "Summary: $RUN_DIR/summary.md"
