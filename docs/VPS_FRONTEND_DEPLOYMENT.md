# VPS Manual Deployment

GitHub Actions production deployment has been disabled.

From now on, all production releases must be completed by logging into the VPS over SSH and pulling the latest code on the server directly.

## Recommended Command

The VPS should use the installed helper command:

```bash
deploy-tinytale frontend
deploy-tinytale api
deploy-tinytale all
```

What it does:
- pulls the latest `main`
- only runs `npm ci` when `package-lock.json` changed
- reuses the shared npm cache under `/var/www/tinytale/shared/npm-cache`
- rebuilds the target service
- restarts the matching PM2 process
- runs a health check after restart

## Frontend and Admin

Assumption:
- Frontend and admin are served from the same `tinytale` Next.js repository on the VPS.
- Public site runs on port `7001`.
- Admin routes are served from the same runtime under `/admin`.

Typical manual deployment flow:

```bash
ssh <user>@<vps-host>
deploy-tinytale frontend
```

## Backend

If the API is deployed from the separate `tinytale-api` repository, deploy it directly on the VPS as well:

```bash
ssh <user>@<vps-host>
deploy-tinytale api
```

Deploy both services together:

```bash
ssh <user>@<vps-host>
deploy-tinytale all
```

## Release Rules

1. Do not rely on GitHub Actions for VPS release or rollback.
2. Always deploy from the server by pulling the exact branch or commit you want to release.
3. Verify both `7001` and `/admin` after each frontend release.
4. Verify `7002/api/health` after each backend release.
5. If a release fails, fix it directly on the VPS or roll back with git on the server.
6. Prefer the helper command over raw manual steps so lockfile-based dependency skipping stays consistent.
