#!/usr/bin/env bash

set -euo pipefail

detect_java_major() {
  local version_output
  version_output="$("$1" -version 2>&1 | head -n 1)"
  echo "$version_output" | sed -E 's/.*version "([0-9]+).*/\1/'
}

ensure_java_21() {
  local current_java="${JAVA_HOME:-}"
  local current_major=""

  if [[ -n "$current_java" && -x "$current_java/bin/java" ]]; then
    current_major="$(detect_java_major "$current_java/bin/java")"
  elif command -v java >/dev/null 2>&1; then
    current_major="$(detect_java_major "$(command -v java)")"
  fi

  if [[ -n "$current_major" && "$current_major" -ge 21 ]]; then
    return 0
  fi

  local candidates=(
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    "$HOME/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done

  echo "Android Studio JDK 21 not found. Please set JAVA_HOME to a Java 21 installation." >&2
  exit 1
}

ensure_java_21
exec "$@"
