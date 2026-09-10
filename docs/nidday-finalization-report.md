# NIDDAY finalization report

## 1. PR #5

**State before:** Open, based on current `main`, with a clean merge state and no GitHub status checks configured.

**State after:** Open and updated with the recovered public branding work, Phase 2 security foundation, validation documentation, and this report.

**Merged:** No.

The PR was not merged because it introduces PostgreSQL RLS and an append-only security ledger, but PostgreSQL is unavailable in the current environment. The required isolation, RLS, migration, and trigger behavior cannot be honestly declared validated without a real PostgreSQL execution. The full build also remains blocked by a reproducible existing `@midday/email` dependency/build incompatibility.

## 2. Main

**Commit before merge decision:** `602a72078c691011ebec34ec50e085f72dde1834`.

**Commit after merge:** unchanged, because the merge was intentionally withheld pending security and database validation.

The canonical PR branch head is `3c75a6cad2942f50ed2c35d1d25523704849faf6`.

## 3. Validation

| Check | Result |
|---|---|
| `git diff --check` | Passed. |
| Website lint | Passed after formatting recovered files. |
| Full lint | Passed after formatting corrections. |
| Typecheck | Dashboard passed with an 8 GB Node heap; the default monorepo run hit the dashboard process heap limit. |
| Tests | Full test suite completed with 13 successful tasks; Phase 2 schema test passed with 3 tests and 10 assertions. |
| Build | Failed reproducibly in `@midday/email`: `framer-motion` requests `activeAnimations` from `motion-dom`. Clearing build caches did not change the result. |

The registry is reachable and Bun 1.3.11 installs the workspace successfully. The lockfile correction is minimal and does not remove application dependencies.

## 4. Database

The new migration is additive and creates:

- `nidday_role_assignments`;
- `evidence_items`;
- `audit_events`.

The Drizzle schema declares matching enums, tables, foreign keys, indexes, and RLS policies. The migration enables RLS on all three tables. Existing migrations and tables were not modified or removed.

A real PostgreSQL migration and policy test remains required. `psql`, PostgreSQL, Docker, and Redis are unavailable in this sandbox.

## 5. Security

The audited foundation contains the eight requested roles: owner, administrator, finance_manager, auditor, project_manager, operator, reviewer, and viewer.

`audit_events` contains team, actor, action, source, resource type, resource ID, timestamp, correlation ID, metadata, state snapshots, and integrity hash fields. A PostgreSQL trigger rejects `UPDATE` and `DELETE`, implementing append-only behavior at the database layer.

`evidence_items` contains team, document, owner, storage provider, private storage key, SHA-256, verification status, verification actor, and timestamps. The migration does not create public file URLs or store provider credentials.

The RLS policies scope reads through the existing `private.get_teams_for_authenticated_user()` helper. Cross-team isolation, unauthorized writes, and trigger behavior still require execution against a real PostgreSQL test database.

## 6. Blockers

### Email build incompatibility

- **Problem:** The `@midday/email` build fails because `framer-motion` requests the `activeAnimations` export from `motion-dom`.
- **Cause:** The installed packages report `framer-motion@12.38.0` and `motion-dom@12.38.0`, while the React Email/Turbopack build statically rejects the requested export. The failure persists after deleting email build caches.
- **Impact:** The full monorepo build is not green.
- **Recommended solution:** Reproduce in CI and inspect the React Email/Turbopack module graph before changing versions. Do not remove packages or apply an unverified pin as part of the NIDDAY security merge.

### Database validation unavailable

- **Problem:** PostgreSQL, Redis, Docker, and `psql` are not available locally.
- **Cause:** Sandbox service limitation.
- **Impact:** RLS, organization isolation, migration execution, and append-only trigger tests remain unverified.
- **Recommended solution:** Run the migration and dedicated security tests in the repository's PostgreSQL staging workflow, then reassess PR #5.

## 7. Next steps before merge

1. Provide a PostgreSQL staging/test service and execute migration, RLS isolation, role authorization, and audit append-only tests.
2. Add server-side authorization tests for the eight roles before exposing write procedures.
3. Resolve the existing React Email/Turbopack motion dependency mismatch in a separate focused change.
4. Re-run the full lint, typecheck, test, and build suite in CI.
5. Merge PR #5 only after the database security checks are green and the build decision is explicitly accepted by review.

No external banking, mobile-money, payment, geolocation, or citizen-facing integration was represented as real in this PR.
