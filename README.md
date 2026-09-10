# NIDDAY

**NIDDAY is a Financial Intelligence and Public Traceability Platform.** It evolves the Midday codebase without discarding its production capabilities for transactions, invoicing, customers, documents, projects, exports, AI-assisted workflows, integrations, API access, background processing, and desktop distribution.

## Architecture

This repository is a Bun + Turborepo monorepo.

| Area | Location | Responsibility |
| --- | --- | --- |
| Marketing site | `apps/website` | Next.js website, product metadata, documentation, and public pages. |
| Application dashboard | `apps/dashboard` | Next.js authenticated product interface. |
| API | `apps/api` | Hono API, typed application endpoints, integrations, and service boundary. |
| Worker | `apps/worker` | BullMQ queue processors, scheduled work, imports, documents, notifications, and insight generation. |
| Desktop | `apps/desktop` | Tauri desktop application. |
| Database | `packages/db` | Drizzle PostgreSQL schema, migrations, RLS-aware policies, queries, and database tests. |
| Supabase | `packages/supabase` | Optional auth, storage, middleware, and database-client integration boundary. |
| Shared platform | `packages/*` | Finance, banking, documents, events, UI, MCP apps, AI connectors, encryption, and utilities. |

The operational deployment boundary is intentionally separate: the website can run on Vercel; API/dashboard services use a Node-compatible runtime; BullMQ workers require a persistent worker runtime plus Redis; PostgreSQL remains external. Supabase is compatible for PostgreSQL, auth, and storage, but is not required merely to build the repository.

## Local development

1. Install [Bun](https://bun.sh/) 1.3.11 or compatible.
2. Run `bun install`.
3. Copy the template appropriate to each application (for example `cp apps/website/.env-template apps/website/.env.local`). Do not commit populated environment files.
4. Start a service with `bun run dev:website`, `bun run dev:dashboard`, or `bun run dev:api`. Run the worker separately with its workspace command.

The public website requires `NEXT_PUBLIC_SITE_URL` for production canonical URLs and `NEXT_PUBLIC_APP_URL` only when an application dashboard is deployed. The API, dashboard, worker, jobs, and insight templates enumerate their provider-specific variables. `DATABASE_URL`/the existing database pooler variables must point to PostgreSQL for database-backed runtime paths.

## Validation

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Database integration tests need PostgreSQL and the documented test database setup in `packages/db`. Some builds also require optional service configuration where an application evaluates provider-backed routes.

## Security principles

- Never commit credentials, tokens, database URLs with passwords, or private keys.
- Keep the existing Supabase RLS and team-scoping model in place; do not treat UI controls as authorization.
- Keep workers and queues outside a serverless-only deployment model.
- Use the existing encryption, storage, API validation, and event infrastructure when adding evidence or traceability functionality.
- Location features must be explicit, permission-controlled, and privacy-aware; NIDDAY does not implement covert tracking.

## NIDDAY roadmap

The current foundation preserves existing financial workflows. Future work should be delivered as migrations and typed APIs—not mock modules—toward: financial traceability links, append-oriented audit records, evidence metadata and verification, authorized project geography, and project/infrastructure milestones.

See [the Phase 1 architecture report](docs/nidday-phase-1-audit.md) for the audited state, safe rename boundary, deployment model, health-check findings, and incremental migration plan.

## License

This project is licensed under **[AGPL-3.0](LICENSE)**. Review the license terms before commercial use or deployment.
