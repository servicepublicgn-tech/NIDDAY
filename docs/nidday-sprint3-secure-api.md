# NIDDAY Sprint 3 — Secure server workflows

## Implemented

The existing tRPC API now exposes a `nidday` router instead of creating a parallel API. Procedures are protected by the existing authentication and team middleware, then apply a second NIDDAY authorization layer that reads the current team plan, enabled module flags, active NIDDAY role assignments, and legacy team membership fallback.

The implemented procedures cover supplier listing, supplier creation, supplier-verification requests, procurement-request creation, controlled procurement state transitions, traceability-link creation, and source-resource trace lookup. Inputs are validated with Zod. Every mutation is team-scoped and writes an append-only `audit_events` row with actor, action, resource, source, and correlation ID. Procurement transitions also create a traceability link; approval requires the existing `approve_expenditure` permission.

Module activation is server-side. A team must explicitly enable a module with a `teams.flags` entry in the form `nidday:module:procurement` or `nidday:module:audit`. The existing Midday plan is mapped conservatively to NIDDAY Starter or Business entitlements. Missing activation denies access rather than silently enabling a capability.

## Workflow policy

Procurement transition rules are extracted into a testable server policy. Skips, backward transitions, and mutations after `closed` are rejected. Approval is a distinct privileged transition and is checked against the caller's effective NIDDAY roles.

## Validation

The targeted NIDDAY API files passed Biome formatting. Three workflow policy tests passed, and the API TypeScript typecheck passed. The full API lint command remains **BLOCKED by a pre-existing formatting error** in `apps/api/scripts/cancel-all-polar-subscriptions.ts`, unrelated to the NIDDAY files; no unrelated script was modified in this increment.

No official Supabase project or production data was changed. No supplier is marked verified by this implementation, and no external banking, government, or supplier-verification integration is claimed.

## Next step

Add the remaining API mutations for procurement items, contracts, milestones, and supplier verification decisions, then add authenticated integration tests using the repository's existing tRPC test harness. The dashboard should only be built after those procedures have stable contracts.
