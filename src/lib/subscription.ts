import type { SubscriptionStatus } from "@/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SubscriptionState {
  canWrite: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialDaysLeft: number;
}

/**
 * Pure function to compute subscription state from raw data.
 * Extracted from getCurrentUser for testability.
 */
export function computeSubscriptionState(
  subscriptionStatus: string | undefined,
  trialEndsAtMs: number,
  nowMs: number
): SubscriptionState {
  const status = (subscriptionStatus as SubscriptionStatus) || "trialing";

  const trialDaysLeft = trialEndsAtMs > 0
    ? Math.max(0, Math.ceil((trialEndsAtMs - nowMs) / DAY_MS))
    : 0;

  const canWrite = status === "active"
    || (status === "trialing" && trialDaysLeft > 0);

  return { canWrite, subscriptionStatus: status, trialDaysLeft };
}
