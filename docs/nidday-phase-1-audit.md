# NIDDAY Phase 1 architecture audit

## Scope and method

This report records the initial audit before implementation. The repository was inspected as a Bun/Turborepo monorepo, including application manifests, shared packages, database schema and migrations, environment templates, deployment descriptors, and GitHub Actions. Phase 1 deliberately changes only public product identity, public metadata, configuration hygiene, and documentation. It does **not** rename package scopes, database objects, provider keys, queue names, API contracts, or existing migrations.

## Existing platform preserved

- **Applications:** website, dashboard, API, desktop, and worker are separate applications under `apps/`.
- **Finance and operations:** shared packages cover banking, accounting, invoices, customers, inbox matching, documents, imports, reporting/insights, plans, notifications, and location utilities.
- **Data:** `packages/db` uses Drizzle with PostgreSQL migrations and contains transactions, invoices, customers, documents, tracker projects, team membership, activity records, and row-level policies.
- **Identity and authorization:** `packages/supabase` provides an optional Supabase auth/storage boundary; database policies and team membership continue to be the enforcement layer.
- **Async workloads:** BullMQ queues and schedulers in `apps/worker` process transaction import/export, document processing, notifications, accounting, invoices, inbox work, institutions, and insights.
- **AI and MCP:** AI SDK provider dependencies, connector packages, MCP app integrations, and assistant-related UI remain intact. Provider keys stay environment-configured.
- **Delivery:** the website includes Vercel configuration; API/dashboard/worker include Railway and Docker configuration; desktop has a Tauri release workflow.

## Safe and gradual rename boundary

### Safe in Phase 1

- Visible website name, hero positioning, header/footer wordmark, browser titles, Open Graph metadata, structured data, and generated Open Graph image default.
- Dashboard browser metadata.
- Root documentation and non-secret configuration templates.

### Gradual migration required

- `@midday/*` workspace package names and imports.
- `midday` database names, migrations, enums, RLS policies, test database identifiers, encryption key names, and queue/worker contracts.
- Existing `MIDDAY_*` environment variables, external provider callback URLs, legacy domains, CDN references, OAuth client registrations, release tags, and analytics event names.
- Existing API URLs and desktop deep-link scheme.

These identifiers are compatibility contracts. Renaming them requires an explicit migration plan, deployment coordination, backwards-compatible redirects/aliases, and verification of third-party OAuth configuration.

## NIDDAY foundation and migration sequence

Phase 2 has started with additive RBAC assignment, protected evidence metadata,
and append-only audit-ledger tables. See
[the Phase 2 foundation](nidday-phase-2-foundation.md) for the implemented
security boundary and intentionally deferred services.

1. **Traceability model:** add additive, team-scoped tables for source, allocation, approval, transfer, expenditure, related entity, status, and immutable event metadata. Reference existing transactions, invoices, documents, and projects instead of duplicating financial records.
2. **Audit log:** introduce append-only records with actor, action, entity type/id, source, timestamp, redacted metadata, and correlation id. Do not repurpose user notification activity as an audit ledger.
3. **Evidence vault:** extend the existing document/storage abstractions with evidence identifiers, related entity links, uploader, capture time, verification state, and version/history. Storage-provider access must remain server-authorized.
4. **Projects and geo:** extend tracker projects using typed, permissioned project and milestone data. Store only consented or operationally authorized location information; no continuous or hidden tracking.
5. **RBAC:** map future roles (owner, administrator, finance manager, auditor, project manager, operator, reviewer, viewer) to verified server/database authorization policies and test every privileged path.

## Deployment boundary

| Component | Recommended runtime | Required external configuration |
| --- | --- | --- |
| Website | Vercel-compatible Next.js | `NEXT_PUBLIC_SITE_URL`; optional public app URL and email/analytics services. |
| Dashboard | Node-compatible Next.js service | Supabase/auth configuration, API URL, database/service integrations as enabled. |
| API | Container or Node runtime (existing Railway config) | PostgreSQL, Redis, auth, encryption, and only the provider credentials enabled for the deployment. |
| Worker | Persistent container/runtime (existing Railway/Docker config) | PostgreSQL, Redis queue, storage/auth, and enabled provider credentials. |
| Database/storage | PostgreSQL, Supabase-compatible | `DATABASE_URL` or current pooler configuration; optional Supabase auth/storage boundary. |

Vercel alone is not an appropriate runtime for BullMQ workers, schedulers, queues, or any persistent process.

## Health check and remaining blockers

- Environment templates were audited. The dashboard template contained a fixed webhook-secret-looking value; it was replaced with an empty value and generation instruction.
- The website previously used a hard-coded production canonical domain and remote Midday Open Graph assets. It now uses `NEXT_PUBLIC_SITE_URL` with a clearly non-production fallback and its local Open Graph route.
- GitHub Actions have their `validate` and tool-selection evaluation jobs disabled (`if: false`) in both staging and production workflows. They should be re-enabled only after the full test database setup and validation suite pass consistently.
- Full lint, typecheck, test, and build results are reported with the implementation change; database-backed tests need their documented PostgreSQL/Redis/service prerequisites.

## Image handling

The supplied institutional marks were delivered as chat attachments, but their original binary files were not available in the repository workspace for a safe web-optimized commit. They are therefore not copied into repository assets. The landing page now includes an institutional-use guardrail that explicitly avoids an endorsement claim. Before adding any institutional logo to the public site, obtain the original asset file, confirm permission and brand-placement rules, add meaningful alt text, and optimize the approved file for web delivery. The platform should not imply endorsement by an institution.
