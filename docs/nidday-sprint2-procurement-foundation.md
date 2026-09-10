# NIDDAY Sprint 2 — Procurement Foundation

## Implemented

This increment adds an additive, team-scoped procurement and traceability foundation on top of the existing Midday entities. It does not replace transactions, invoices, documents, or tracker projects.

The new domain tables are:

- `nidday_suppliers`
- `nidday_procurement_requests`
- `nidday_procurement_items`
- `nidday_procurement_approvals`
- `nidday_procurement_contracts`
- `nidday_project_milestones`
- `nidday_traceability_links`

Existing `teams`, `users`, `tracker_projects`, and NIDDAY `audit_events` remain the relationship anchors. Supplier verification is explicit and defaults to `unverified`; no supplier is presented as verified automatically.

## Lifecycle and security

Procurement requests use the lifecycle `draft → submitted → reviewed → approved → contracted → active → completed → audited → closed`. Approval, contract, supplier verification, and milestone states are represented by typed PostgreSQL enums.

Every new table has a team relationship, timestamps, indexes, and RLS enabled. Read policies are limited to authenticated users whose team is returned by the existing `private.get_teams_for_authenticated_user()` boundary. No client-side write policies were added; server procedures must enforce RBAC and emit audit events when write operations are implemented.

Traceability links are generic and typed. They connect source and target records by resource type and ID, allowing existing transactions, invoices, documents, projects, suppliers, contracts, and evidence to remain the source systems rather than introducing duplicate accounting tables.

## Validation

- 17 focused schema, RBAC, module capability, and procurement tests passed.
- Database Biome lint passed.
- Database TypeScript typecheck passed.
- Migration `0040_nidday_procurement_traceability_foundation.sql` applied successfully to the isolated local PostgreSQL database.
- Six new enums and seven new tables were observed locally.
- RLS was enabled on all seven new tables.
- Official Supabase project `iysvfjsnoiomtyptuply` was not modified.

## Remaining implementation

The next increment must add authenticated API procedures for request creation, approval transitions, supplier verification, milestone updates, and traceability-link creation. Those procedures must call the existing server authorization patterns, require the NIDDAY module capability gate, validate input, and append safe audit events. No external procurement, banking, government, or supplier verification integration is claimed by this migration.
