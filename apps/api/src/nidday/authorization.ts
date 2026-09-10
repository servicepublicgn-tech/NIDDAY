import type { Database } from "@midday/db/client";
import { niddayRoleAssignments, teams, usersOnTeam } from "@midday/db/schema";
import {
  canUseNiddayModule,
  type NiddayModule,
} from "@midday/db/security/nidday-modules";
import type { NiddayRole } from "@midday/db/security/nidday-rbac";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";

const planMap = {
  trial: "starter",
  starter: "starter",
  pro: "business",
} as const;

type LegacyTeamPlan = keyof typeof planMap;

export async function requireNiddayModule(input: {
  db: Database;
  teamId: string;
  userId: string;
  module: NiddayModule;
}) {
  const team = await input.db
    .select({ plan: teams.plan, flags: teams.flags })
    .from(teams)
    .where(eq(teams.id, input.teamId))
    .limit(1);

  const record = team[0];
  if (!record) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Team not found" });
  }

  const assignments = await input.db
    .select({ role: niddayRoleAssignments.role })
    .from(niddayRoleAssignments)
    .where(
      and(
        eq(niddayRoleAssignments.teamId, input.teamId),
        eq(niddayRoleAssignments.userId, input.userId),
        isNull(niddayRoleAssignments.revokedAt),
      ),
    );

  let roles: NiddayRole[] = assignments.map((assignment) => assignment.role);
  if (roles.length === 0) {
    const membership = await input.db
      .select({ role: usersOnTeam.role })
      .from(usersOnTeam)
      .where(
        and(
          eq(usersOnTeam.teamId, input.teamId),
          eq(usersOnTeam.userId, input.userId),
        ),
      )
      .limit(1);
    if (membership[0]?.role === "owner") roles = ["owner"];
    if (membership[0]?.role === "member") roles = ["viewer"];
  }

  const plan = planMap[record.plan as LegacyTeamPlan];
  const enabledModules = (record.flags ?? [])
    .filter((flag) => flag.startsWith("nidday:module:"))
    .map((flag) => flag.slice("nidday:module:".length))
    .filter((module): module is NiddayModule =>
      [
        "finance",
        "procurement",
        "projects",
        "evidence",
        "audit",
        "geo",
        "citizen",
        "integrations",
        "ai",
      ].includes(module),
    );

  const decision = canUseNiddayModule({
    module: input.module,
    plan,
    enabledModules,
    roles,
  });
  if (!decision.allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `NIDDAY ${input.module} access denied: ${decision.reason}`,
    });
  }

  return { plan, roles };
}
