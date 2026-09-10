# NIDDAY Phase 2 foundation: RBAC, evidence, and audit

## Delivered scope

This additive database foundation begins Phase 2A and Phase 2B without
replacing the existing Midday team, document, transaction, project, or
Supabase architecture.

Migration `0039_add_nidday_security_traceability_foundation.sql` adds:

- `nidday_role_assignments`: explicit organization-scoped role assignments for
  owner, administrator, finance manager, auditor, project manager, operator,
  reviewer, and viewer. The legacy `users_on_team.role` remains unchanged for
  compatibility.
- `evidence_items`: protected evidence metadata that links an existing document
  and its private storage reference to a team, owner, verification status, hash,
  and integrity metadata. It does not publish file storage keys or make files
  public.
- `audit_events`: an append-only, team-scoped audit ledger for server-authorized
  actions. It records actor, action, resource, source, correlation id, redacted
  state snapshots, metadata, integrity hash, and timestamp.

## Security model

- All three tables have PostgreSQL RLS enabled.
- Authenticated users may only read rows belonging to a team returned by
  `private.get_teams_for_authenticated_user()`.
- There are deliberately no browser/client INSERT, UPDATE, or DELETE policies.
  Future API procedures must authorize the caller, validate input, and write
  through a trusted server/service path.
- A database trigger rejects updates and deletes from `audit_events`, making the
  audit ledger append-only at the database layer.
- `evidence_items` keeps document permissions separate from evidence metadata;
  an evidence row never creates a public download URL.

## Explicit non-deliveries

This migration does not claim to implement payments, a citizen portal, public
data publication, bank/mobile-money providers, procurement workflows, automatic
approval, or geolocation tracking. These require dedicated product rules,
authorization tests, provider credentials, and APIs before they can be exposed.

## Next implementation sequence

1. Add server-only audit writer helpers and tests for append-only behavior and
   cross-team access denial.
2. Add permission checks mapping NIDDAY roles to individual server procedures;
   do not authorize from UI state.
3. Build private evidence upload/finalization procedures over the existing
   storage abstraction, including SHA-256 calculation and verification workflow.
4. Add project budgets, contracts, allocations, approvals, and traceability
   links as further additive migrations.
5. Implement payment/bank/mobile-money adapters only after provider contracts,
   signed webhooks, idempotency rules, and credentials are available.
