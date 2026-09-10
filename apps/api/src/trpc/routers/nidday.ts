import { requireNiddayModule } from "@api/nidday/authorization";
import {
  canTransitionProcurement,
  isApprovalTransition,
} from "@api/nidday/workflow";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  auditEvents,
  niddayProcurementApprovals,
  niddayProcurementRequests,
  niddaySuppliers,
  niddayTraceabilityLinks,
} from "@midday/db/schema";
import { hasAnyNiddayRolePermission } from "@midday/db/security/nidday-rbac";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

const requestStatus = z.enum([
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
const traceabilityType = z.enum([
  "source",
  "allocation",
  "approval",
  "commitment",
  "transaction",
  "payment",
  "evidence",
  "project",
  "supplier",
  "invoice",
  "outcome",
]);

async function writeAudit(
  db: Parameters<typeof requireNiddayModule>[0]["db"],
  input: {
    teamId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(auditEvents).values({
    teamId: input.teamId,
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    source: "api",
    correlationId: input.correlationId,
    metadata: input.metadata ?? {},
  });
}

export const niddayRouter = createTRPCRouter({
  listSuppliers: protectedProcedure
    .input(
      z.object({ search: z.string().trim().max(120).optional() }).optional(),
    )
    .query(async ({ input, ctx: { db, teamId, session } }) => {
      await requireNiddayModule({
        db,
        teamId: teamId!,
        userId: session.user.id,
        module: "procurement",
      });
      const rows = await db
        .select()
        .from(niddaySuppliers)
        .where(eq(niddaySuppliers.teamId, teamId!))
        .orderBy(desc(niddaySuppliers.createdAt));
      const search = input?.search?.toLowerCase();
      return search
        ? rows.filter((supplier) =>
            supplier.legalName.toLowerCase().includes(search),
          )
        : rows;
    }),

  createSupplier: protectedProcedure
    .input(
      z.object({
        legalName: z.string().trim().min(2).max(200),
        registrationId: z.string().trim().max(120).optional(),
        country: z.string().length(2).optional(),
      }),
    )
    .mutation(async ({ input, ctx: { db, teamId, session, requestId } }) => {
      await requireNiddayModule({
        db,
        teamId: teamId!,
        userId: session.user.id,
        module: "procurement",
      });
      const [supplier] = await db
        .insert(niddaySuppliers)
        .values({ ...input, teamId: teamId! })
        .returning();
      if (!supplier) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Supplier could not be created",
        });
      }
      await writeAudit(db, {
        teamId: teamId!,
        actorId: session.user.id,
        action: "supplier.created",
        resourceType: "supplier",
        resourceId: supplier.id,
        correlationId: requestId,
      });
      return supplier;
    }),

  requestSupplierVerification: protectedProcedure
    .input(z.object({ supplierId: z.string().uuid() }))
    .mutation(async ({ input, ctx: { db, teamId, session, requestId } }) => {
      await requireNiddayModule({
        db,
        teamId: teamId!,
        userId: session.user.id,
        module: "procurement",
      });
      const [supplier] = await db
        .update(niddaySuppliers)
        .set({
          verificationStatus: "pending",
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(niddaySuppliers.id, input.supplierId),
            eq(niddaySuppliers.teamId, teamId!),
          ),
        )
        .returning();
      if (!supplier)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Supplier not found",
        });
      await writeAudit(db, {
        teamId: teamId!,
        actorId: session.user.id,
        action: "supplier.verification_requested",
        resourceType: "supplier",
        resourceId: supplier.id,
        correlationId: requestId,
      });
      return supplier;
    }),

  createProcurementRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(3).max(240),
        description: z.string().trim().max(5000).optional(),
        projectId: z.string().uuid().optional(),
        budgetAmount: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/)
          .optional(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ input, ctx: { db, teamId, session, requestId } }) => {
      await requireNiddayModule({
        db,
        teamId: teamId!,
        userId: session.user.id,
        module: "procurement",
      });
      const [request] = await db
        .insert(niddayProcurementRequests)
        .values({ ...input, teamId: teamId!, requestedBy: session.user.id })
        .returning();
      if (!request) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Procurement request could not be created",
        });
      }
      await writeAudit(db, {
        teamId: teamId!,
        actorId: session.user.id,
        action: "procurement.created",
        resourceType: "procurement_request",
        resourceId: request.id,
        correlationId: requestId,
      });
      return request;
    }),

  transitionProcurementRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        toStatus: requestStatus,
        comment: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ input, ctx: { db, teamId, session, requestId } }) => {
      const authorization = await requireNiddayModule({
        db,
        teamId: teamId!,
        userId: session.user.id,
        module: "procurement",
      });
      const [current] = await db
        .select()
        .from(niddayProcurementRequests)
        .where(
          and(
            eq(niddayProcurementRequests.id, input.requestId),
            eq(niddayProcurementRequests.teamId, teamId!),
          ),
        )
        .limit(1);
      if (!current)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Procurement request not found",
        });
      if (!canTransitionProcurement(current.status, input.toStatus))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid procurement transition: ${current.status} to ${input.toStatus}`,
        });
      if (
        isApprovalTransition(input.toStatus) &&
        !hasAnyNiddayRolePermission(authorization.roles, "approve_expenditure")
      )
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Approval permission required",
        });
      const [updated] = await db
        .update(niddayProcurementRequests)
        .set({ status: input.toStatus, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(niddayProcurementRequests.id, current.id),
            eq(niddayProcurementRequests.teamId, teamId!),
            eq(niddayProcurementRequests.status, current.status),
          ),
        )
        .returning();
      if (!updated)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Procurement request changed; retry",
        });
      if (isApprovalTransition(input.toStatus))
        await db.insert(niddayProcurementApprovals).values({
          teamId: teamId!,
          requestId: current.id,
          approverId: session.user.id,
          status: "approved",
          comment: input.comment,
          decidedAt: new Date().toISOString(),
        });
      await writeAudit(db, {
        teamId: teamId!,
        actorId: session.user.id,
        action: `procurement.${input.toStatus}`,
        resourceType: "procurement_request",
        resourceId: current.id,
        correlationId: requestId,
        metadata: {
          fromStatus: current.status,
          toStatus: input.toStatus,
          comment: input.comment,
        },
      });
      await db
        .insert(niddayTraceabilityLinks)
        .values({
          teamId: teamId!,
          linkType: isApprovalTransition(input.toStatus)
            ? "approval"
            : "commitment",
          sourceType: "procurement_request",
          sourceId: current.id,
          targetType: "procurement_request_status",
          targetId: input.toStatus,
          createdBy: session.user.id,
          metadata: { correlationId: requestId },
        })
        .onConflictDoNothing();
      return updated;
    }),

  createTraceabilityLink: protectedProcedure
    .input(
      z.object({
        linkType: traceabilityType,
        sourceType: z.string().trim().min(1).max(80),
        sourceId: z.string().trim().min(1).max(120),
        targetType: z.string().trim().min(1).max(80),
        targetId: z.string().trim().min(1).max(120),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx: { db, teamId, session, requestId } }) => {
      await requireNiddayModule({
        db,
        teamId: teamId!,
        userId: session.user.id,
        module: "audit",
      });
      const [link] = await db
        .insert(niddayTraceabilityLinks)
        .values({
          ...input,
          teamId: teamId!,
          createdBy: session.user.id,
          metadata: input.metadata ?? {},
        })
        .onConflictDoNothing()
        .returning();
      if (!link)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Traceability link already exists",
        });
      await writeAudit(db, {
        teamId: teamId!,
        actorId: session.user.id,
        action: "traceability.link_created",
        resourceType: "traceability_link",
        resourceId: link.id,
        correlationId: requestId,
        metadata: {
          sourceType: input.sourceType,
          targetType: input.targetType,
        },
      });
      return link;
    }),

  traceResource: protectedProcedure
    .input(
      z.object({
        resourceType: z.string().trim().min(1).max(80),
        resourceId: z.string().trim().min(1).max(120),
      }),
    )
    .query(async ({ input, ctx: { db, teamId, session } }) => {
      await requireNiddayModule({
        db,
        teamId: teamId!,
        userId: session.user.id,
        module: "audit",
      });
      return db
        .select()
        .from(niddayTraceabilityLinks)
        .where(
          and(
            eq(niddayTraceabilityLinks.teamId, teamId!),
            eq(niddayTraceabilityLinks.sourceType, input.resourceType),
            eq(niddayTraceabilityLinks.sourceId, input.resourceId),
          ),
        )
        .orderBy(desc(niddayTraceabilityLinks.createdAt));
    }),
});
