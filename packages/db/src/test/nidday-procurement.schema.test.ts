import { describe, expect, test } from "bun:test";
import {
  niddayProcurementApprovals,
  niddayProcurementContracts,
  niddayProcurementItems,
  niddayProcurementRequests,
  niddayProjectMilestones,
  niddaySuppliers,
  niddayTraceabilityLinks,
  procurementRequestStatusEnum,
  projectMilestoneStatusEnum,
  supplierVerificationStatusEnum,
  traceabilityLinkTypeEnum,
} from "../schema";

describe("NIDDAY procurement and traceability schema", () => {
  test("defines the procurement request lifecycle", () => {
    expect(procurementRequestStatusEnum.enumValues).toEqual([
      "draft",
      "submitted",
      "reviewed",
      "approved",
      "contracted",
      "active",
      "completed",
      "audited",
      "closed",
    ]);
    expect(niddayProcurementRequests.teamId.notNull).toBe(true);
    expect(niddayProcurementRequests.title.notNull).toBe(true);
    expect(niddayProcurementItems.teamId.notNull).toBe(true);
    expect(niddayProcurementApprovals.teamId.notNull).toBe(true);
  });

  test("keeps suppliers explicitly unverified until a real verification process", () => {
    expect(supplierVerificationStatusEnum.enumValues).toEqual([
      "unverified",
      "pending",
      "verified",
      "rejected",
    ]);
    expect(niddaySuppliers.legalName.notNull).toBe(true);
    expect(niddaySuppliers.verificationStatus.notNull).toBe(true);
  });

  test("connects contracts and milestones to existing projects additively", () => {
    expect(niddayProcurementContracts.teamId.notNull).toBe(true);
    expect(niddayProcurementContracts.supplierId.notNull).toBe(true);
    expect(niddayProjectMilestones.projectId.notNull).toBe(true);
    expect(projectMilestoneStatusEnum.enumValues).toContain("delayed");
  });

  test("stores generic, typed traceability links without duplicating finance tables", () => {
    expect(traceabilityLinkTypeEnum.enumValues).toContain("transaction");
    expect(traceabilityLinkTypeEnum.enumValues).toContain("evidence");
    expect(niddayTraceabilityLinks.teamId.notNull).toBe(true);
    expect(niddayTraceabilityLinks.sourceType.notNull).toBe(true);
    expect(niddayTraceabilityLinks.targetType.notNull).toBe(true);
  });
});
