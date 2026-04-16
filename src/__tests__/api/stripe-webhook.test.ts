import { describe, it, expect } from "vitest";
import { mapStripeStatus } from "@/app/api/stripe/webhook/route";

describe("mapStripeStatus", () => {
  it("maps active → active", () => {
    expect(mapStripeStatus("active")).toBe("active");
  });

  it("maps trialing → active", () => {
    expect(mapStripeStatus("trialing")).toBe("active");
  });

  it("maps canceled → expired", () => {
    expect(mapStripeStatus("canceled")).toBe("expired");
  });

  it("maps unpaid → expired", () => {
    expect(mapStripeStatus("unpaid")).toBe("expired");
  });

  it("maps past_due → active (grace period)", () => {
    expect(mapStripeStatus("past_due")).toBe("active");
  });

  it("maps incomplete → active (grace period)", () => {
    expect(mapStripeStatus("incomplete")).toBe("active");
  });

  it("maps unknown status → expired (safe default)", () => {
    expect(mapStripeStatus("something_weird")).toBe("expired");
  });

  it("maps empty string → expired", () => {
    expect(mapStripeStatus("")).toBe("expired");
  });
});
