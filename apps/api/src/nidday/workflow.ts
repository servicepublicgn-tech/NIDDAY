export const procurementStatuses = [
  "draft",
  "submitted",
  "reviewed",
  "approved",
  "contracted",
  "active",
  "completed",
  "audited",
  "closed",
] as const;
export type ProcurementStatus = (typeof procurementStatuses)[number];

const allowedTransitions: Readonly<
  Record<ProcurementStatus, readonly ProcurementStatus[]>
> = {
  draft: ["submitted"],
  submitted: ["reviewed"],
  reviewed: ["approved", "draft"],
  approved: ["contracted"],
  contracted: ["active"],
  active: ["completed"],
  completed: ["audited"],
  audited: ["closed"],
  closed: [],
};

export function canTransitionProcurement(
  from: ProcurementStatus,
  to: ProcurementStatus,
): boolean {
  return allowedTransitions[from].includes(to);
}

export function isApprovalTransition(to: ProcurementStatus): boolean {
  return to === "approved";
}
