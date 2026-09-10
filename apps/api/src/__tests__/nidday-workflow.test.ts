import { describe, expect, test } from "bun:test";
import {
  canTransitionProcurement,
  isApprovalTransition,
} from "../nidday/workflow";

describe("NIDDAY procurement workflow policy", () => {
  test("allows the ordered lifecycle transitions", () => {
    expect(canTransitionProcurement("draft", "submitted")).toBe(true);
    expect(canTransitionProcurement("submitted", "reviewed")).toBe(true);
    expect(canTransitionProcurement("reviewed", "approved")).toBe(true);
    expect(canTransitionProcurement("approved", "contracted")).toBe(true);
    expect(canTransitionProcurement("contracted", "active")).toBe(true);
    expect(canTransitionProcurement("active", "completed")).toBe(true);
    expect(canTransitionProcurement("completed", "audited")).toBe(true);
    expect(canTransitionProcurement("audited", "closed")).toBe(true);
  });

  test("rejects skips, backward transitions, and closed mutations", () => {
    expect(canTransitionProcurement("draft", "approved")).toBe(false);
    expect(canTransitionProcurement("approved", "draft")).toBe(false);
    expect(canTransitionProcurement("closed", "active")).toBe(false);
  });

  test("marks approval as the privileged transition", () => {
    expect(isApprovalTransition("approved")).toBe(true);
    expect(isApprovalTransition("reviewed")).toBe(false);
  });
});
