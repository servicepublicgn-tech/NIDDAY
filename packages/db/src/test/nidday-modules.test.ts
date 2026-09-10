import { describe, expect, test } from "bun:test";
import {
  canUseNiddayModule,
  niddayModuleCapabilities,
  niddayModules,
} from "../security/nidday-modules";

describe("NIDDAY module capabilities", () => {
  test("defines every planned module with a minimum plan and permission", () => {
    expect(Object.keys(niddayModuleCapabilities).sort()).toEqual(
      [...niddayModules].sort(),
    );
    for (const module of niddayModules) {
      expect(
        niddayModuleCapabilities[module].requiredPermissions.length,
      ).toBeGreaterThan(0);
    }
  });

  test("denies disabled modules before checking entitlements", () => {
    expect(
      canUseNiddayModule({
        module: "evidence",
        plan: "enterprise",
        enabledModules: [],
        roles: ["owner"],
      }),
    ).toEqual({
      allowed: false,
      module: "evidence",
      plan: "enterprise",
      reason: "module_disabled",
    });
  });

  test("enforces plan minimums server-side", () => {
    expect(
      canUseNiddayModule({
        module: "procurement",
        plan: "starter",
        enabledModules: ["procurement"],
        roles: ["owner"],
      }),
    ).toMatchObject({
      allowed: false,
      reason: "plan_required",
      requiredPlan: "business",
    });
  });

  test("enforces role permissions even for entitled plans", () => {
    expect(
      canUseNiddayModule({
        module: "audit",
        plan: "enterprise",
        enabledModules: ["audit"],
        roles: ["operator"],
      }),
    ).toMatchObject({ allowed: false, reason: "permission_required" });
  });

  test("allows an enabled module when plan and RBAC both pass", () => {
    expect(
      canUseNiddayModule({
        module: "procurement",
        plan: "business",
        enabledModules: ["procurement"],
        roles: ["administrator"],
      }),
    ).toEqual({ allowed: true, module: "procurement", plan: "business" });
  });
});
