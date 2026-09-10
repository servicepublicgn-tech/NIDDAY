export const niddayRoles = [
  "owner",
  "administrator",
  "finance_manager",
  "auditor",
  "project_manager",
  "operator",
  "reviewer",
  "viewer",
] as const;

export type NiddayRole = (typeof niddayRoles)[number];

export const niddayPermissions = [
  "manage_roles",
  "read_evidence",
  "write_evidence",
  "verify_evidence",
  "read_audit",
  "write_audit",
  "approve_expenditure",
] as const;

export type NiddayPermission = (typeof niddayPermissions)[number];

/**
 * The Phase 2 policy is intentionally deny-by-default. Database RLS remains
 * the tenant boundary; this matrix is the server-side least-privilege check
 * before a trusted procedure writes or reads NIDDAY records.
 */
export const niddayRolePermissions: Readonly<
  Record<NiddayRole, readonly NiddayPermission[]>
> = {
  owner: niddayPermissions,
  administrator: niddayPermissions,
  finance_manager: [
    "read_evidence",
    "write_evidence",
    "read_audit",
    "write_audit",
    "approve_expenditure",
  ],
  auditor: ["read_evidence", "read_audit"],
  project_manager: [
    "read_evidence",
    "write_evidence",
    "read_audit",
    "approve_expenditure",
  ],
  operator: ["read_evidence", "write_evidence"],
  reviewer: ["read_evidence", "verify_evidence", "read_audit"],
  viewer: ["read_evidence", "read_audit"],
};

export function hasNiddayPermission(
  role: NiddayRole,
  permission: NiddayPermission,
): boolean {
  return niddayRolePermissions[role].includes(permission);
}

export function hasAnyNiddayRolePermission(
  roles: readonly NiddayRole[],
  permission: NiddayPermission,
): boolean {
  return roles.some((role) => hasNiddayPermission(role, permission));
}
