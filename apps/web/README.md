# Web Compatibility Shell

`apps/web` is the monorepo entrypoint for the existing Next.js SSR app.

During Phase 0-2, the actual runtime source still lives at the repository root
so production behavior stays unchanged while shared packages are extracted.

Phase 8 boundary rule:

- `apps/web` is script and workspace glue only
- feature code remains in the root `src/` app until it is intentionally moved into `packages/*`
- `apps/web` must not depend on `apps/native-shell`
