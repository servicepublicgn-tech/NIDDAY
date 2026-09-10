# NIDDAY environment validation

## Audit date

2026-09-10 UTC.

## Repository and package manager

The connected repository is `servicepublicgn-tech/midday` (display name: NIDDAY). The repository uses Bun, with `packageManager: bun@1.3.11` and a committed `bun.lock`. The integration branch is based on the current `main` branch and contains the additive Phase 2 foundation changes only; the existing Phase 1 branding and landing-page files remain unchanged.

The environment initially had Node.js `v22.13.0` and npm `10.9.2`, but Bun was not installed. Bun `1.3.11` was installed without changing package manifests. The workspace then installed successfully with `bun install`, installing 2,043 packages.

## Registry and lockfile diagnosis

The reported npm registry failure could not be reproduced. The configured registry is `https://registry.npmjs.org/`; `npm ping --registry=https://registry.npmjs.org/` returned `PONG`, and `npm view bun@1.3.11 version --registry=https://registry.npmjs.org/` returned `1.3.11`.

No repository `.npmrc` was found. The only discovered user-level npm configuration was `/home/ubuntu/.nvm/.npmrc`, containing `package-lock=false`. No npm, proxy, or registry credentials were added to the repository. The project package manager remains Bun, not npm.

`bun install --frozen-lockfile` initially failed because the committed lockfile did not contain the dependency resolution entries required by the current manifests. A normal `bun install` succeeded and regenerated a minimal 14-line lockfile correction involving nested `@types/node`/`undici-types` entries. No package manifest was changed and no dependency was deliberately removed or upgraded.

## Commands used

```text
node --version
npm --version
bun --version
npm config get registry
npm ping --registry=https://registry.npmjs.org/
npm view bun@1.3.11 version --registry=https://registry.npmjs.org/
bun install --frozen-lockfile
bun install
bun run lint
bun run typecheck
bun run test
bun run build
cd apps/dashboard && NODE_OPTIONS=--max-old-space-size=8192 bun run typecheck
bun test packages/db/src/test/nidday-foundation.schema.test.ts
```

## Validation results

The full lint suite passed after applying two safe Biome formatting fixes in the pre-existing website files touched by the rebranding work (`apps/website/src/components/header.tsx` and `apps/website/src/components/startpage.tsx`). The focused Phase 2 schema test passed with 3 tests and 10 assertions. The full test suite completed with 13 successful tasks. The dashboard typecheck initially exceeded the default heap, but passed when run from its package directory with an 8 GB Node heap.

The full build is not green. It is blocked in the existing `@midday/email` package because `framer-motion` requests the `activeAnimations` export, which is absent from the installed `motion-dom` module. This is an unrelated pre-existing dependency/build compatibility issue; no application dependency was changed to conceal it.

PostgreSQL, `psql`, Redis, and Docker are not available in the current sandbox. Therefore database migration execution, PostgreSQL RLS tests, append-only trigger tests, and Redis-backed integration tests cannot be declared validated here. The repository includes `docker-compose.test.yml`, which is the appropriate staging/test service definition when those services are available.

## Security interpretation

The Phase 2 migration is additive. It preserves existing finance and team models, enables RLS on the new tables, scopes authenticated reads through the existing team-membership helper, and provides no browser-side write policies. The audit ledger has a database trigger rejecting updates and deletes. These controls require execution against PostgreSQL before production-readiness can be claimed.

No production credentials, provider credentials, bank APIs, mobile-money APIs, or private storage keys were added or represented as real integrations.
