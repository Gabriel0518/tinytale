#!/usr/bin/env bash

set -euo pipefail

ADB_BIN="${ADB_BIN:-/Users/gabriel/Library/Android/sdk/platform-tools/adb}"
APP_ID="${APP_ID:-top.tinytale.app}"
PLAY_TAP_X="${PLAY_TAP_X:-540}"
PLAY_TAP_Y="${PLAY_TAP_Y:-2190}"
LAUNCH_WAIT_SECONDS="${LAUNCH_WAIT_SECONDS:-3}"
PLAYER_WAIT_SECONDS="${PLAYER_WAIT_SECONDS:-10}"
OUTPUT_DIR="${OUTPUT_DIR:-/Users/gabriel/tinytale/.codex-assets/verification}"

usage() {
  cat <<EOF
Usage: $0 [device-serial]

Environment overrides:
  ADB_BIN              adb binary path
  APP_ID               Android package id (default: top.tinytale.app)
  PLAY_TAP_X           Play tab x coordinate (default: 540)
  PLAY_TAP_Y           Play tab y coordinate (default: 2190)
  LAUNCH_WAIT_SECONDS  Wait after app launch (default: 3)
  PLAYER_WAIT_SECONDS  Wait after play tap (default: 10)
  OUTPUT_DIR           Output folder for logs/screenshots
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
  devices="$("$ADB_BIN" devices | awk 'NR>1 && $2=="device" {print $1}')"
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

DEVICE_SERIAL="$(resolve_device "${1:-}")"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
RUN_DIR="$OUTPUT_DIR/android-smoke-$TIMESTAMP"

mkdir -p "$RUN_DIR"

echo "Using device: $DEVICE_SERIAL"
echo "Artifacts: $RUN_DIR"

"$ADB_BIN" -s "$DEVICE_SERIAL" logcat -c
"$ADB_BIN" -s "$DEVICE_SERIAL" shell am force-stop "$APP_ID"
"$ADB_BIN" -s "$DEVICE_SERIAL" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep "$LAUNCH_WAIT_SECONDS"

"$ADB_BIN" -s "$DEVICE_SERIAL" exec-out uiautomator dump /dev/tty > "$RUN_DIR/ui-before-play.xml" || true
"$ADB_BIN" -s "$DEVICE_SERIAL" shell input tap "$PLAY_TAP_X" "$PLAY_TAP_Y"
sleep "$PLAYER_WAIT_SECONDS"

"$ADB_BIN" -s "$DEVICE_SERIAL" shell screencap -p /sdcard/player-smoke.png
"$ADB_BIN" -s "$DEVICE_SERIAL" pull /sdcard/player-smoke.png "$RUN_DIR/player-smoke.png" >/dev/null
"$ADB_BIN" -s "$DEVICE_SERIAL" shell rm /sdcard/player-smoke.png >/dev/null 2>&1 || true

"$ADB_BIN" -s "$DEVICE_SERIAL" exec-out uiautomator dump /dev/tty > "$RUN_DIR/ui-after-play.xml" || true
"$ADB_BIN" -s "$DEVICE_SERIAL" shell dumpsys window windows > "$RUN_DIR/dumpsys-window.txt"
"$ADB_BIN" -s "$DEVICE_SERIAL" logcat -d > "$RUN_DIR/logcat.txt"

echo
echo "Smoke run complete."
echo "Screenshot: $RUN_DIR/player-smoke.png"
echo "UI tree:    $RUN_DIR/ui-after-play.xml"
echo "Logcat:     $RUN_DIR/logcat.txt"
