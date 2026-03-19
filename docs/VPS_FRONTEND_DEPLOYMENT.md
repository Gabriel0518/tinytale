# VPS Manual Deployment

GitHub Actions production deployment has been disabled.

From now on, all production releases must be completed by logging into the VPS over SSH and pulling the latest code on the server directly.

## Frontend and Admin

Assumption:
- Frontend and admin are served from the same `tinytale` Next.js repository on the VPS.
- Public site runs on port `7001`.
- Admin routes are served from the same runtime under `/admin`.

Typical manual deployment flow:

```bash
ssh <user>@<vps-host>
cd /var/www/tinytale/frontend
git fetch origin
git checkout main
git pull --ff-only origin main
npm ci --no-audit --no-fund
npm run build
pm2 restart tinytale-web --update-env
curl -I http://127.0.0.1:7001/zh
curl -I http://127.0.0.1:7001/admin/login
```

## Backend

If the API is deployed from the separate `tinytale-api` repository, deploy it directly on the VPS as well:

```bash
ssh <user>@<vps-host>
cd /var/www/tinytale-api
git fetch origin
git checkout main
git pull --ff-only origin main
npm ci --no-audit --no-fund
npm run build
pm2 restart tinytale-api --update-env
curl -I http://127.0.0.1:7002/api/health
```

## Release Rules

1. Do not rely on GitHub Actions for VPS release or rollback.
2. Always deploy from the server by pulling the exact branch or commit you want to release.
3. Verify both `7001` and `/admin` after each frontend release.
4. Verify `7002/api/health` after each backend release.
5. If a release fails, fix it directly on the VPS or roll back with git on the server.
