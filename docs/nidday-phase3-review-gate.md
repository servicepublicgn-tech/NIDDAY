# NIDDAY Phase 3 — Controlled Database Bootstrap Recovery

## Decision

**Review gate: STOP before the official Supabase project.** No DDL, policy, user, bucket, credential, or data was created or modified on project `iysvfjsnoiomtyptuply`.

The controlled candidate was tested only on a local PostgreSQL 16 database named `nidday_phase3`. The official Supabase project remains production-targeted and untouched.

## Provenance

The candidate uses the current NIDDAY Drizzle source at `packages/db/src/schema.ts`, with the repository-provided isolated prerequisites in `packages/db/src/test/helpers/setup-test-db.sql`. The historical compatibility baseline remains Midday upstream commit `51587319f26a0ffaa9dfccab1920373cb65689b7`.

The repository contains 40 numbered SQL migration files through `0039`, but no executable `0000` baseline. The Drizzle snapshot is JSON metadata, not a bootstrap SQL script, and the journal does not represent the complete replay chain. Therefore the candidate is a **current-schema bootstrap candidate**, not proof that the historical `0001`–`0039` chain is replayable from an empty database.

## Inventory and divergence summary

| Object | Current `schema.ts` | Snapshot `0000` | SQL migrations | Status |
|---|---:|---:|---:|---|
| Public tables | 53 declarations, including `auth.users` reference | 43 | 9 explicit table creations detected in migration SQL | Divergent; requires baseline decision |
| Enums | 36 | 22 | 9 explicit enum creations detected | Current schema contains NIDDAY and later additions |
| Migration files | — | One journal baseline entry | 40 files, `0001`–`0039` with numbering gaps/duplicates | Historical replay not canonical |
| NIDDAY tables | `audit_events`, `evidence_items`, `nidday_role_assignments` | Absent | Added by `0039` | Additive and preserved |
| Snapshot-only tables | — | `inbox_embeddings`, `transaction_embeddings` | Historical references exist | Unresolved; do not delete |
| Current-schema-only tables | Several, including NIDDAY and newer Midday objects | Absent | Mixed historical provenance | Requires owner review |

The full machine-readable inventory is in `docs/nidday-phase3-inventory.json`.

## Candidate bootstrap result

The candidate was applied to a clean local PostgreSQL 16 database using:

1. `CREATE EXTENSION vector`;
2. `CREATE EXTENSION pg_trgm`;
3. isolated `auth` and `private` schemas;
4. local non-login roles `anon`, `authenticated`, and `service_role`;
5. repository test-only helper functions;
6. `drizzle-kit push --config drizzle.config.test.ts --force` against the local database.

Result: **PASS** for current-schema creation. Drizzle reported `[✓] Changes applied`.

The local database contains 52 public tables after the push and 36 public enums. The count difference from the 53 TypeScript declarations is expected because `auth.users` is an external Supabase-managed table reference and was intentionally suppressed by the test schema override.

## NIDDAY Phase 2 verification

The local candidate contains:

- `audit_events`;
- `evidence_items`;
- `nidday_role_assignments`;
- `nidday_role` enum with eight values;
- `evidence_status` enum with four values;
- `audit_source` enum with five values;
- RLS enabled on all three NIDDAY tables;
- one authenticated-team-member SELECT policy on each NIDDAY table.

Result: **PASS** for table, enum, RLS, and policy presence on the isolated candidate.

The append-only trigger fragment from migration `0039` was applied locally after candidate creation and verified with `pg_get_triggerdef`:

```text
 audit_events_no_update_or_delete
 BEFORE DELETE OR UPDATE ON public.audit_events
 EXECUTE FUNCTION private.prevent_audit_event_mutation()
```

Result: **PASS** for trigger creation and definition verification. The full `0039` replay was not falsely claimed as successful because the candidate already contains its target NIDDAY objects.

## Defects found and corrected

The first isolated replay exposed invalid index operator classes in the current schema:

- `transactions.team_id` was configured with `date_ops` instead of `uuid_ops`;
- `transactions.name` was configured with `uuid_ops` instead of `text_ops`;
- `transactions.bank_account_id` was configured with `date_ops` instead of `uuid_ops`;
- `documents.team_id` and `documents.parent_id` had incorrect operator classes in their composite index.

These were corrected without changing table names, columns, business behavior, or data semantics. The local replay then advanced to platform prerequisites.

The isolated setup was also missing:

- `pg_trgm`, required by `gin_trgm_ops` indexes;
- Supabase-compatible non-login roles `anon`, `authenticated`, and `service_role`, required by policies.

Those prerequisites were added only to the repository test setup and local validation environment.

## Test results

| Test | Result | Evidence |
|---|---|---|
| Local Drizzle current-schema bootstrap | **PASS** | `[✓] Changes applied` on clean `nidday_phase3` |
| Local table/enum/RLS/policy inspection | **PASS** | 52 public tables, 36 enums, three NIDDAY tables with RLS and policies |
| Local append-only trigger definition | **PASS** | Trigger exists on `public.audit_events` |
| NIDDAY schema contract tests | **PASS** | 3 tests, 0 failures |
| RBAC contract tests | **PASS** | 5 tests, 0 failures; 8 total tests passed |
| Database Biome lint | **PASS** | 90 files checked, no fixes |
| Database TypeScript typecheck | **PASS** | `tsc --noEmit` exited 0 |
| Historical `0001`–`0039` replay from empty database | **BLOCKED** | No canonical executable `0000` baseline; migration chain is not replayable as-is |
| Full migration `0039` replay after current-schema push | **BLOCKED** | Target objects already exist in candidate; only trigger fragment was separately verified |
| Official Supabase DDL | **NOT RUN** | Intentionally prohibited before review approval |

## Remaining risks

The following items remain unresolved and must not be inferred away:

1. The canonical contents of the missing Midday baseline are not present in the repository.
2. The snapshot and current schema diverge, including snapshot-only embedding tables and current-only NIDDAY/newer Midday objects.
3. Several functions and the production implementation of `private.get_teams_for_authenticated_user()` require validation against the real Supabase architecture.
4. The local helper functions are test stubs and must not be promoted to production.
5. Supabase-managed `auth.users`, Auth roles, Storage schemas, permissions, and extensions must be validated in a dedicated staging project before production application.
6. Historical migration replay and rollback behavior remain unproven.

## Exact plan for official Supabase

Do not apply the candidate to `iysvfjsnoiomtyptuply` yet. The next safe sequence is:

1. Obtain owner approval for the corrected schema changes and the test prerequisite changes.
2. Create a separate disposable Supabase staging project, not the official production target.
3. Validate extensions, Auth roles, `auth.users` mapping, private functions, grants, and RLS semantics there.
4. Decide and document the canonical baseline source for Midday.
5. Produce a replayable migration manifest or approved baseline SQL, reviewed against the current Midday application contracts.
6. Replay the baseline and `0039` in staging from empty state, verifying every migration boundary.
7. Run the complete application validation suite against staging.
8. Stop again for a production review gate.
9. Only after explicit approval, apply additive migrations to the official project with a recorded backup and rollback plan.

No Vercel or backend deployment is ready to depend on this database yet. The current-schema candidate is locally reproducible and test-validated, but the production bootstrap provenance and historical replay chain remain blocked.
