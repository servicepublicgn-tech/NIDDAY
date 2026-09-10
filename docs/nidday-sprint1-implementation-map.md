# NIDDAY Sprint 1 implementation map

## Existing foundation to preserve

NIDDAY remains an additive evolution of Midday. Finance, transactions, accounting, invoices, customers, documents, projects, banking abstractions, reporting, imports, notifications, API, dashboard, worker, desktop, AI, and MCP capabilities remain the existing product foundation. The existing `teams` and `users_on_team` model remains the organization boundary; no parallel organization table is introduced in Sprint 1.

The NIDDAY security foundation already provides the eight organizational roles, a deny-by-default permission matrix, RLS-backed traceability tables, and an append-only audit ledger design. The Phase 3 work additionally validated the current Drizzle schema against isolated PostgreSQL and corrected invalid index operator classes.

## Sprint 1 implementation

The first product implementation is a reusable server-side capability gate in `packages/db/src/security/nidday-modules.ts`. It defines the optional NIDDAY modules, plan tiers, minimum plan requirements, required permissions, and a single decision function that checks all of the following in order:

1. whether the module is enabled for the organization;
2. whether the organization plan is entitled to the module;
3. whether the caller's existing NIDDAY roles provide the required permissions.

The result is a typed allow/deny decision suitable for API procedures and server actions. UI visibility is not treated as authorization.

## Module capability matrix

| Module | Minimum plan | Required server permission |
|---|---|---|
| Finance | Starter | `read_evidence` |
| Projects | Starter | `read_evidence` |
| Evidence | Starter | `read_evidence` |
| Audit | Starter | `read_audit` |
| Procurement | Business | `write_evidence` |
| Geo | Business | `write_evidence` |
| Integrations | Business | `write_evidence` |
| AI | Business | `read_evidence`, `read_audit` |
| Citizen | Enterprise | `read_evidence` |

These initial gates are conservative capability prerequisites, not a claim that the underlying product modules are fully implemented. A later sprint must attach each capability to concrete organization configuration persisted in an additive database model and enforce it at API/RLS boundaries.

## Next implementation order

The next safe work is to integrate this decision function into the existing API middleware without creating a parallel API. After that, Sprint 2 should add organization-scoped module configuration and audit events for module changes. Sprint 3 can then add budgets and approval workflows using new additive tables, tested migrations, API procedures, server authorization, and real dashboard data states.

No banking, mobile-money, map, citizen, or production Supabase integration is claimed by this map. Those modules remain disabled until their official provider, storage, Auth, or staging prerequisites are available.
