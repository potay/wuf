import { describe, it, expect } from "vitest";
import { computeSubscriptionState } from "@/lib/subscription";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();

describe("computeSubscriptionState", () => {
  describe("canWrite", () => {
    it("active subscription → canWrite = true", () => {
      const result = computeSubscriptionState("active", 0, NOW);
      expect(result.canWrite).toBe(true);
    });

    it("trialing with 10 days left → canWrite = true", () => {
      const trialEnd = NOW + 10 * DAY_MS;
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.canWrite).toBe(true);
    });

    it("trialing with 1 day left → canWrite = true", () => {
      const trialEnd = NOW + 1 * DAY_MS;
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.canWrite).toBe(true);
    });

    it("trialing with 0 days left (expired today) → canWrite = false", () => {
      const trialEnd = NOW - 1000; // just expired
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.canWrite).toBe(false);
    });

    it("trialing with trial ended yesterday → canWrite = false", () => {
      const trialEnd = NOW - DAY_MS;
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.canWrite).toBe(false);
    });

    it("expired status → canWrite = false", () => {
      const result = computeSubscriptionState("expired", NOW + 10 * DAY_MS, NOW);
      expect(result.canWrite).toBe(false);
    });

    it("cancelled status → canWrite = false", () => {
      const result = computeSubscriptionState("cancelled", NOW + 10 * DAY_MS, NOW);
      expect(result.canWrite).toBe(false);
    });

    it("undefined status defaults to trialing", () => {
      const trialEnd = NOW + 5 * DAY_MS;
      const result = computeSubscriptionState(undefined, trialEnd, NOW);
      expect(result.subscriptionStatus).toBe("trialing");
      expect(result.canWrite).toBe(true);
    });

    it("no trialEndsAt (0) with trialing → canWrite = false", () => {
      const result = computeSubscriptionState("trialing", 0, NOW);
      expect(result.canWrite).toBe(false);
      expect(result.trialDaysLeft).toBe(0);
    });
  });

  describe("trialDaysLeft", () => {
    it("14 days from now → 14", () => {
      const trialEnd = NOW + 14 * DAY_MS;
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.trialDaysLeft).toBe(14);
    });

    it("12 hours from now → 1 (rounds up)", () => {
      const trialEnd = NOW + 12 * 60 * 60 * 1000;
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.trialDaysLeft).toBe(1);
    });

    it("1 second from now → 1 (rounds up)", () => {
      const trialEnd = NOW + 1000;
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.trialDaysLeft).toBe(1);
    });

    it("already expired → 0", () => {
      const trialEnd = NOW - DAY_MS;
      const result = computeSubscriptionState("trialing", trialEnd, NOW);
      expect(result.trialDaysLeft).toBe(0);
    });

    it("trialEndsAt = 0 → 0", () => {
      const result = computeSubscriptionState("trialing", 0, NOW);
      expect(result.trialDaysLeft).toBe(0);
    });

    it("active subscription ignores trial", () => {
      const result = computeSubscriptionState("active", 0, NOW);
      expect(result.trialDaysLeft).toBe(0);
      expect(result.canWrite).toBe(true); // active overrides
    });
  });

  describe("subscriptionStatus normalization", () => {
    it("undefined → trialing", () => {
      const result = computeSubscriptionState(undefined, NOW + DAY_MS, NOW);
      expect(result.subscriptionStatus).toBe("trialing");
    });

    it("preserves active", () => {
      expect(computeSubscriptionState("active", 0, NOW).subscriptionStatus).toBe("active");
    });

    it("preserves expired", () => {
      expect(computeSubscriptionState("expired", 0, NOW).subscriptionStatus).toBe("expired");
    });

    it("preserves cancelled", () => {
      expect(computeSubscriptionState("cancelled", 0, NOW).subscriptionStatus).toBe("cancelled");
    });
  });
});
