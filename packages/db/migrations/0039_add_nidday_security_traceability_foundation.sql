-- Phase 2A/2B additive foundation. Existing Midday team membership, documents,
-- and finance tables remain the source of truth; these tables only add RBAC,
-- evidence metadata, and an immutable audit ledger.

CREATE TYPE nidday_role AS ENUM (
  'owner', 'administrator', 'finance_manager', 'auditor',
  'project_manager', 'operator', 'reviewer', 'viewer'
);
CREATE TYPE evidence_status AS ENUM ('pending', 'verified', 'rejected', 'superseded');
CREATE TYPE audit_source AS ENUM ('api', 'user', 'worker', 'integration', 'system');

CREATE TABLE nidday_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role nidday_role NOT NULL,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  revoked_at timestamptz
);

CREATE UNIQUE INDEX nidday_role_assignments_active_unique
  ON nidday_role_assignments (team_id, user_id, role)
  WHERE revoked_at IS NULL;
CREATE INDEX nidday_role_assignments_team_user_idx
  ON nidday_role_assignments (team_id, user_id);

CREATE TABLE evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  external_id text NOT NULL,
  storage_provider text NOT NULL,
  storage_key text NOT NULL,
  sha256 varchar(64),
  content_type text,
  byte_size bigint,
  status evidence_status DEFAULT 'pending' NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  verified_at timestamptz,
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT evidence_items_team_external_id_unique UNIQUE (team_id, external_id)
);

CREATE INDEX evidence_items_team_created_idx
  ON evidence_items (team_id, created_at DESC);
CREATE INDEX evidence_items_document_idx ON evidence_items (document_id);
CREATE INDEX evidence_items_sha256_idx ON evidence_items (sha256);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  source audit_source NOT NULL,
  correlation_id text,
  previous_state jsonb,
  next_state jsonb,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  integrity_hash varchar(64),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX audit_events_team_created_idx
  ON audit_events (team_id, created_at DESC);
CREATE INDEX audit_events_resource_idx
  ON audit_events (team_id, resource_type, resource_id);
CREATE INDEX audit_events_correlation_idx ON audit_events (correlation_id);

ALTER TABLE nidday_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "NIDDAY role assignments are visible to team members"
  ON nidday_role_assignments FOR SELECT TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Evidence items are visible to team members"
  ON evidence_items FOR SELECT TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Audit events are visible to team members"
  ON audit_events FOR SELECT TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

-- No client-side INSERT/UPDATE/DELETE policies are intentionally granted for
-- NIDDAY RBAC, evidence, or audit rows. New server procedures must authorize,
-- validate, and write through a trusted service path.

CREATE OR REPLACE FUNCTION private.prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$;

CREATE TRIGGER audit_events_no_update_or_delete
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION private.prevent_audit_event_mutation();
