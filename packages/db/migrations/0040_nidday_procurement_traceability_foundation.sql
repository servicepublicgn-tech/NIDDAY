-- NIDDAY Sprint 2 additive procurement, project operations, and traceability foundation.
-- Existing Midday tables remain the source of truth; all new records are team-scoped.
CREATE TYPE procurement_request_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved', 'contracted', 'active', 'completed', 'audited', 'closed');
CREATE TYPE supplier_verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE procurement_approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE procurement_contract_status AS ENUM ('draft', 'active', 'completed', 'terminated');
CREATE TYPE project_milestone_status AS ENUM ('planned', 'in_progress', 'completed', 'delayed', 'cancelled');
CREATE TYPE traceability_link_type AS ENUM ('source', 'allocation', 'approval', 'commitment', 'transaction', 'payment', 'evidence', 'project', 'supplier', 'invoice', 'outcome');

CREATE TABLE nidday_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  registration_id text,
  country varchar(2),
  verification_status supplier_verification_status DEFAULT 'unverified' NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT nidday_suppliers_team_registration_unique UNIQUE (team_id, registration_id)
);
CREATE INDEX nidday_suppliers_team_status_idx ON nidday_suppliers (team_id, verification_status);

CREATE TABLE nidday_procurement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id uuid REFERENCES tracker_projects(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status procurement_request_status DEFAULT 'draft' NOT NULL,
  budget_amount numeric(14,2),
  currency varchar(3),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX nidday_procurement_requests_team_status_idx ON nidday_procurement_requests (team_id, status);
CREATE INDEX nidday_procurement_requests_project_idx ON nidday_procurement_requests (project_id);

CREATE TABLE nidday_procurement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES nidday_procurement_requests(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL,
  unit_price numeric(14,2),
  currency varchar(3),
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX nidday_procurement_items_team_request_idx ON nidday_procurement_items (team_id, request_id);
CREATE INDEX nidday_procurement_items_request_idx ON nidday_procurement_items (request_id);

CREATE TABLE nidday_procurement_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES nidday_procurement_requests(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status procurement_approval_status DEFAULT 'pending' NOT NULL,
  comment text,
  decided_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX nidday_procurement_approvals_team_request_idx ON nidday_procurement_approvals (team_id, request_id);
CREATE INDEX nidday_procurement_approvals_request_idx ON nidday_procurement_approvals (request_id);

CREATE TABLE nidday_procurement_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  request_id uuid REFERENCES nidday_procurement_requests(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES nidday_suppliers(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES tracker_projects(id) ON DELETE SET NULL,
  contract_number text NOT NULL,
  status procurement_contract_status DEFAULT 'draft' NOT NULL,
  value numeric(14,2),
  currency varchar(3),
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT nidday_procurement_contracts_team_number_unique UNIQUE (team_id, contract_number)
);
CREATE INDEX nidday_procurement_contracts_team_status_idx ON nidday_procurement_contracts (team_id, status);

CREATE TABLE nidday_project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES tracker_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  status project_milestone_status DEFAULT 'planned' NOT NULL,
  due_date date,
  completed_at timestamptz,
  progress numeric(5,2) DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX nidday_project_milestones_team_project_idx ON nidday_project_milestones (team_id, project_id);

CREATE TABLE nidday_traceability_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  link_type traceability_link_type NOT NULL,
  source_type text NOT NULL,
  source_id text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT nidday_traceability_links_unique UNIQUE (team_id, link_type, source_type, source_id, target_type, target_id)
);
CREATE INDEX nidday_traceability_links_team_source_idx ON nidday_traceability_links (team_id, source_type, source_id);
CREATE INDEX nidday_traceability_links_team_target_idx ON nidday_traceability_links (team_id, target_type, target_id);

ALTER TABLE nidday_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidday_procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidday_procurement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidday_procurement_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidday_procurement_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidday_project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidday_traceability_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "NIDDAY suppliers are visible to team members" ON nidday_suppliers FOR SELECT TO authenticated USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
CREATE POLICY "NIDDAY procurement requests are visible to team members" ON nidday_procurement_requests FOR SELECT TO authenticated USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
CREATE POLICY "NIDDAY procurement items are visible to team members" ON nidday_procurement_items FOR SELECT TO authenticated USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
CREATE POLICY "NIDDAY procurement approvals are visible to team members" ON nidday_procurement_approvals FOR SELECT TO authenticated USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
CREATE POLICY "NIDDAY procurement contracts are visible to team members" ON nidday_procurement_contracts FOR SELECT TO authenticated USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
CREATE POLICY "NIDDAY project milestones are visible to team members" ON nidday_project_milestones FOR SELECT TO authenticated USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
CREATE POLICY "NIDDAY traceability links are visible to team members" ON nidday_traceability_links FOR SELECT TO authenticated USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
