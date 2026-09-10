# NIDDAY Supabase readiness report

## Project identified

- **Project name:** NIDDAY's Project
- **Project Reference:** `iysvfjsnoiomtyptuply`
- **Project URL:** `https://iysvfjsnoiomtyptuply.supabase.co`
- **Region:** `eu-central-1`
- **Status:** `ACTIVE_HEALTHY`
- **PostgreSQL:** 17.6.1.166 / PostgreSQL 17

## Real database audit

The Supabase project is newly created and healthy, but its application database is currently empty. The Supabase catalog contains the managed `auth` and `storage` schemas. The `auth.users` table exists with zero rows. `storage.buckets` exists with zero rows. The `public` schema contains zero application tables, zero user migrations, and zero public RLS policies.

The following NIDDAY Phase 2 tables are absent from the real database:

- `audit_events`
- `evidence_items`
- `nidday_role_assignments`

The following Phase 2 enums are also absent:

- `nidday_role`
- `evidence_status`
- `audit_source`

No data or tables were modified. No migration was applied.

## Local repository comparison

The repository's Drizzle snapshot describes a Midday baseline of 43 public tables and 22 enums, including `teams`, `users`, `documents`, transactions, invoices, banking, activities, tracker projects, and existing authentication mappings. The local migration directory contains incremental migrations `0001` through `0039`, but it does not contain a complete executable initial `0000` SQL migration for bootstrapping an empty database. Its `_journal.json` contains only the baseline snapshot entry.

Migration `0039_add_nidday_security_traceability_foundation.sql` is additive and correctly references existing Midday tables:

- `teams(id)`;
- `users(id)`;
- `documents(id)`.

Because those prerequisite tables do not exist in the real Supabase project, applying migration `0039` alone would fail and would be unsafe. It was intentionally not applied.

## Auth and Storage

Supabase Auth is available and currently has no application users. Existing application code uses the repository's Supabase client boundary and expects:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- `SUPABASE_SECRET_KEY` for trusted server/worker contexts;
- `SUPABASE_URL` for API/worker contexts;
- `SUPABASE_JWT_SECRET` for the API JWT verification path where configured.

Storage is available through the managed `storage` schema, but no bucket has been created. No bucket or storage policy was created because the existing Midday baseline schema and server-side storage contract must be bootstrapped first.

## Safe decision

No destructive action was taken. No tables were dropped, renamed, or overwritten. No fake user, bucket, credential, banking integration, or seed data was created.

The next safe operation is to produce or obtain the canonical Midday initial schema bootstrap for this empty Supabase project, validate it against the local Drizzle snapshot, apply it as an additive baseline, and only then apply the NIDDAY Phase 2 migration. The repository currently lacks that executable initial bootstrap SQL, so applying the incremental migrations directly is not safe.

## Staging and Vercel readiness

The Supabase project is ready as an infrastructure target, but not yet application-ready. Before staging or Vercel deployment:

1. Establish the canonical Midday baseline schema in Supabase without changing the repository's existing contracts.
2. Apply the incremental migrations in dependency order, then apply the NIDDAY Phase 2 foundation.
3. Create only the required private Evidence Vault bucket after confirming the existing storage path conventions and policies.
4. Configure Vercel/API/worker environment variables from the deployment secret stores; never commit values.
5. Run PostgreSQL RLS, RBAC, audit append-only, and evidence access tests against the real staging database.

The project is therefore **Supabase infrastructure-ready but not yet safe to deploy the NIDDAY application**.
