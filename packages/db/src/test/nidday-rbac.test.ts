import { describe, expect, test } from "bun:test";
import {
  hasAnyNiddayRolePermission,
  hasNiddayPermission,
  niddayPermissions,
  niddayRolePermissions,
  niddayRoles,
} from "../security/nidday-rbac";

describe("NIDDAY RBAC policy", () => {
  test("defines the complete Phase 2 role set", () => {
    expect(niddayRoles).toEqual([
      "owner",
      "administrator",
      "finance_manager",
      "auditor",
      "project_manager",
      "operator",
      "reviewer",
      "viewer",
    ]);
  });

  test("keeps owner and administrator as the only role managers", () => {
    expect(hasNiddayPermission("owner", "manage_roles")).toBe(true);
    expect(hasNiddayPermission("administrator", "manage_roles")).toBe(true);

    for (const role of niddayRoles.filter(
      (role) => role !== "owner" && role !== "administrator",
    )) {
      expect(hasNiddayPermission(role, "manage_roles")).toBe(false);
    }
  });

  test("enforces least privilege for evidence and approvals", () => {
    expect(hasNiddayPermission("operator", "write_evidence")).toBe(true);
    expect(hasNiddayPermission("operator", "verify_evidence")).toBe(false);
    expect(hasNiddayPermission("reviewer", "verify_evidence")).toBe(true);
    expect(hasNiddayPermission("viewer", "write_evidence")).toBe(false);
    expect(hasNiddayPermission("auditor", "approve_expenditure")).toBe(false);
    expect(hasNiddayPermission("finance_manager", "approve_expenditure")).toBe(
      true,
    );
  });

  test("supports a multi-role server authorization decision", () => {
    expect(
      hasAnyNiddayRolePermission(["viewer", "reviewer"], "verify_evidence"),
    ).toBe(true);
    expect(
      hasAnyNiddayRolePermission(["viewer", "auditor"], "write_evidence"),
    ).toBe(false);
  });

  test("keeps every declared permission represented in the role matrix", () => {
    const represented = new Set(Object.values(niddayRolePermissions).flat());

    for (const permission of niddayPermissions) {
      expect(represented.has(permission)).toBe(true);
    }
  });
});
