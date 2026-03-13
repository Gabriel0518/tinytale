# VPS Frontend Production Deployment (Scheme A)

This project uses VPS as the only production frontend runtime for `tinytale.top` while keeping Cloudflare NS and proxy settings unchanged.

## What this workflow does

Workflow file: `.github/workflows/deploy-vps-frontend.yml`

1. SSH to VPS.
2. Pull target commit (`github.sha` on push; configurable ref on manual dispatch).
3. Run `npm ci` and `npm run build` in the frontend directory.
4. Reload PM2 process (`tinytale-web` by default).
5. Run health check on VPS URL (default `http://127.0.0.1:7001/zh`).
6. If any step fails, rollback to the previous git SHA and rebuild/restart automatically.
7. Optionally purge Cloudflare cache (if `CF_API_TOKEN` and `CF_ZONE_ID` are set).

## Required repository secrets

- `VPS_HOST`
- `VPS_SSH_USER`
- `VPS_SSH_PRIVATE_KEY`
- `VPS_FRONTEND_PATH` (example: `/var/www/tinytale/frontend`)

## Optional repository secrets

- `VPS_SSH_PORT` (default: `22`)
- `VPS_PM2_FRONTEND_APP` (default: `tinytale-web`)
- `VPS_FRONTEND_HEALTHCHECK_URL` (default: `http://127.0.0.1:7001/zh`)
- `CF_API_TOKEN` (for cache purge)
- `CF_ZONE_ID` (for cache purge)

## Trigger modes

1. Push to `main`: auto deploy.
2. Manual dispatch:
- `ref`: deploy specific SHA/tag/branch.
- `skip_purge`: set `true` to skip Cloudflare purge.

## Important operational notes

1. Keep `tinytale.top` traffic on the VPS origin under Cloudflare proxy to avoid Vercel/VPS split runtime.
2. Keep PM2 process name stable (`tinytale-web`) unless you also update the secret.
3. Prefer SSH deploy key for VPS git access; do not keep PAT in git remote URL.
4. If rollback is triggered, inspect the failed workflow logs and PM2 logs before re-run.
