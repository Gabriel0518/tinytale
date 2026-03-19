#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/tinytale"
FRONTEND_DIR="$APP_ROOT/frontend"
API_DIR="$APP_ROOT/api"
SHARED_DIR="$APP_ROOT/shared"
NPM_CACHE_DIR="$SHARED_DIR/npm-cache"
DEPLOY_LOCK_FILE="$APP_ROOT/deploy.lock"

usage() {
  cat <<'EOF'
Usage:
  deploy-tinytale frontend
  deploy-tinytale api
  deploy-tinytale all

Behavior:
  - Pulls the latest main branch on the VPS
  - Re-runs npm ci only when package-lock.json changed
  - Rebuilds the target app
  - Restarts the matching PM2 process
  - Runs a basic health check
EOF
}

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local attempts="${3:-15}"
  local sleep_seconds="${4:-2}"
  local attempt=1
  local output=""
  local status=0

  while (( attempt <= attempts )); do
    output=""
    status=0
    output="$(curl --fail --silent --show-error --max-time 20 "$url" 2>&1)" || status=$?

    if (( status == 0 )); then
      log "$label is healthy."
      return 0
    fi

    if (( attempt == attempts )); then
      if [[ -n "$output" ]]; then
        log "$label health check error: $output"
      fi
      log "$label failed health check after $attempts attempts."
      return 1
    fi

    if [[ -n "$output" ]]; then
      log "Waiting for $label... ($attempt/$attempts) $output"
    fi
    sleep "$sleep_seconds"
    attempt=$((attempt + 1))
  done
}

require_dir() {
  local target_dir="$1"
  if [[ ! -d "$target_dir" ]]; then
    log "Missing directory: $target_dir"
    exit 1
  fi
}

ensure_dependencies() {
  local repo_dir="$1"
  local repo_name="$2"
  local lockfile="$repo_dir/package-lock.json"
  local stamp_dir="$repo_dir/.deploy"
  local stamp_file="$stamp_dir/deps.stamp"
  local node_version
  local current_hash
  local current_stamp
  local previous_stamp=""

  mkdir -p "$stamp_dir" "$NPM_CACHE_DIR"

  if [[ ! -f "$lockfile" ]]; then
    log "Missing lockfile for $repo_name: $lockfile"
    exit 1
  fi

  node_version="$(node -v)"
  current_hash="$(sha256sum "$lockfile" | awk '{print $1}')"
  current_stamp="${current_hash}|${node_version}"

  if [[ -f "$stamp_file" ]]; then
    previous_stamp="$(cat "$stamp_file")"
  fi

  if [[ -d "$repo_dir/node_modules" && "$current_stamp" == "$previous_stamp" ]]; then
    log "Dependencies unchanged for $repo_name, skipping npm ci."
    return 0
  fi

  log "Installing dependencies for $repo_name..."
  (
    cd "$repo_dir"
    npm ci --no-audit --no-fund --prefer-offline --cache "$NPM_CACHE_DIR"
  )
  printf '%s\n' "$current_stamp" > "$stamp_file"
}

git_update() {
  local repo_dir="$1"
  local repo_name="$2"

  log "Updating $repo_name repository..."
  (
    cd "$repo_dir"
    git fetch origin
    git checkout main
    git pull --ff-only origin main
  )
}

deploy_api() {
  require_dir "$API_DIR"
  git_update "$API_DIR" "API"
  ensure_dependencies "$API_DIR" "API"

  log "Building API..."
  (
    cd "$API_DIR"
    npm run build
  )

  log "Restarting tinytale-api..."
  pm2 restart tinytale-api --update-env

  log "Checking API health..."
  wait_for_http "http://127.0.0.1:7002/api/health" "API"
}

deploy_frontend() {
  require_dir "$FRONTEND_DIR"
  git_update "$FRONTEND_DIR" "frontend"
  ensure_dependencies "$FRONTEND_DIR" "frontend"

  log "Building frontend..."
  (
    cd "$FRONTEND_DIR"
    npm run build
  )

  log "Restarting tinytale-web..."
  pm2 restart tinytale-web --update-env

  log "Checking frontend health..."
  wait_for_http "http://127.0.0.1:7001/admin/login" "Frontend"
}

main() {
  local target="${1:-}"
  if [[ -z "$target" ]]; then
    usage
    exit 1
  fi

  exec 9>"$DEPLOY_LOCK_FILE"
  if ! flock -n 9; then
    log "Another deployment is currently running."
    exit 1
  fi

  case "$target" in
    frontend)
      deploy_frontend
      ;;
    api)
      deploy_api
      ;;
    all)
      deploy_api
      deploy_frontend
      ;;
    *)
      usage
      exit 1
      ;;
  esac

  log "Deployment finished for: $target"
}

main "$@"
