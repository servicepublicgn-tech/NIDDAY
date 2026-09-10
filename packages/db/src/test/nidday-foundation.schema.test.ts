import { describe, expect, test } from "bun:test";
import {
  auditEvents,
  auditSourceEnum,
  evidenceItems,
  evidenceStatusEnum,
  niddayRoleAssignments,
  niddayRoleEnum,
} from "../schema";

describe("NIDDAY security and traceability schema", () => {
  test("defines the least-privilege organization roles", () => {
    expect(niddayRoleEnum.enumValues).toEqual([
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

  test("keeps evidence metadata team-scoped and integrity-aware", () => {
    expect(evidenceItems.teamId.notNull).toBe(true);
    expect(evidenceItems.storageKey.notNull).toBe(true);
    expect(evidenceItems.sha256.name).toBe("sha256");
    expect(evidenceStatusEnum.enumValues).toContain("verified");
  });

  test("defines audit records with a team, action, source, and resource", () => {
    expect(auditEvents.teamId.notNull).toBe(true);
    expect(auditEvents.action.notNull).toBe(true);
    expect(auditEvents.resourceType.notNull).toBe(true);
    expect(auditSourceEnum.enumValues).toContain("integration");
    expect(niddayRoleAssignments.role.notNull).toBe(true);
  });
});
