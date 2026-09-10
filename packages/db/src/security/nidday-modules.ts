import {
  hasAnyNiddayRolePermission,
  type NiddayPermission,
  type NiddayRole,
} from "./nidday-rbac";

export const niddayModules = [
  "finance",
  "procurement",
  "projects",
  "evidence",
  "audit",
  "geo",
  "citizen",
  "integrations",
  "ai",
] as const;
export type NiddayModule = (typeof niddayModules)[number];

export const niddayPlans = ["starter", "business", "enterprise"] as const;
export type NiddayPlan = (typeof niddayPlans)[number];

export type NiddayModuleCapability = {
  readonly module: NiddayModule;
  readonly requiredPermissions: readonly NiddayPermission[];
  readonly minimumPlan: NiddayPlan;
};

export const niddayModuleCapabilities: Readonly<
  Record<NiddayModule, NiddayModuleCapability>
> = {
  finance: {
    module: "finance",
    requiredPermissions: ["read_evidence"],
    minimumPlan: "starter",
  },
  procurement: {
    module: "procurement",
    requiredPermissions: ["write_evidence"],
    minimumPlan: "business",
  },
  projects: {
    module: "projects",
    requiredPermissions: ["read_evidence"],
    minimumPlan: "starter",
  },
  evidence: {
    module: "evidence",
    requiredPermissions: ["read_evidence"],
    minimumPlan: "starter",
  },
  audit: {
    module: "audit",
    requiredPermissions: ["read_audit"],
    minimumPlan: "starter",
  },
  geo: {
    module: "geo",
    requiredPermissions: ["write_evidence"],
    minimumPlan: "business",
  },
  citizen: {
    module: "citizen",
    requiredPermissions: ["read_evidence"],
    minimumPlan: "enterprise",
  },
  integrations: {
    module: "integrations",
    requiredPermissions: ["write_evidence"],
    minimumPlan: "business",
  },
  ai: {
    module: "ai",
    requiredPermissions: ["read_evidence", "read_audit"],
    minimumPlan: "business",
  },
};

const planRank: Readonly<Record<NiddayPlan, number>> = {
  starter: 1,
  business: 2,
  enterprise: 3,
};

export type NiddayModuleDecision =
  | { allowed: true; module: NiddayModule; plan: NiddayPlan }
  | {
      allowed: false;
      module: NiddayModule;
      plan: NiddayPlan;
      reason: "module_disabled" | "plan_required" | "permission_required";
      requiredPlan?: NiddayPlan;
      requiredPermissions?: readonly NiddayPermission[];
    };

export function canUseNiddayModule(input: {
  module: NiddayModule;
  plan: NiddayPlan;
  enabledModules: readonly NiddayModule[];
  roles: readonly NiddayRole[];
}): NiddayModuleDecision {
  const capability = niddayModuleCapabilities[input.module];
  if (!input.enabledModules.includes(input.module)) {
    return {
      allowed: false,
      module: input.module,
      plan: input.plan,
      reason: "module_disabled",
    };
  }

  if (planRank[input.plan] < planRank[capability.minimumPlan]) {
    return {
      allowed: false,
      module: input.module,
      plan: input.plan,
      reason: "plan_required",
      requiredPlan: capability.minimumPlan,
    };
  }

  if (
    !capability.requiredPermissions.every((permission) =>
      hasAnyNiddayRolePermission(input.roles, permission),
    )
  ) {
    return {
      allowed: false,
      module: input.module,
      plan: input.plan,
      reason: "permission_required",
      requiredPermissions: capability.requiredPermissions,
    };
  }

  return { allowed: true, module: input.module, plan: input.plan };
}
