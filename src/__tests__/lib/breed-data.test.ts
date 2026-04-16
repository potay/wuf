import { describe, it, expect } from "vitest";
import { getBreedPrior } from "@/lib/breed-data";

describe("getBreedPrior", () => {
  it("matches exact breed name", () => {
    const result = getBreedPrior("aussiedoodle");
    expect(result.matched).toBe(true);
    expect(result.matchedName).toBe("aussiedoodle");
    expect(result.category).toBe("medium");
    expect(result.adultWeightLbs.min).toBe(25);
    expect(result.adultWeightLbs.max).toBe(70);
  });

  it("matches alias (lab -> labrador retriever)", () => {
    const result = getBreedPrior("lab");
    expect(result.matched).toBe(true);
    expect(result.matchedName).toBe("labrador retriever");
    expect(result.category).toBe("large");
  });

  it("matches alias (yorkie -> yorkshire terrier)", () => {
    const result = getBreedPrior("yorkie");
    expect(result.matched).toBe(true);
    expect(result.matchedName).toBe("yorkshire terrier");
    expect(result.category).toBe("toy");
  });

  it("matches substring (golden retriever mix)", () => {
    const result = getBreedPrior("golden retriever mix");
    expect(result.matched).toBe(true);
    expect(result.matchedName).toBe("golden retriever");
  });

  it("is case insensitive", () => {
    const result = getBreedPrior("AUSSIEDOODLE");
    expect(result.matched).toBe(true);
    expect(result.matchedName).toBe("aussiedoodle");
  });

  it("returns medium default for unknown breed", () => {
    const result = getBreedPrior("some rare breed");
    expect(result.matched).toBe(false);
    expect(result.category).toBe("medium");
    expect(result.adultWeightLbs.min).toBe(25);
    expect(result.adultWeightLbs.max).toBe(60);
  });

  it("returns medium default for empty string", () => {
    const result = getBreedPrior("");
    expect(result.matched).toBe(false);
    expect(result.category).toBe("medium");
  });

  it("returns medium default for null", () => {
    const result = getBreedPrior(null);
    expect(result.matched).toBe(false);
  });

  it("returns medium default for undefined", () => {
    const result = getBreedPrior(undefined);
    expect(result.matched).toBe(false);
  });

  it("computes geometric mean correctly", () => {
    const result = getBreedPrior("chihuahua");
    expect(result.matched).toBe(true);
    // geometric mean of 3 and 7 = sqrt(21) ≈ 4.58
    expect(result.meanAdultWeightLbs).toBeCloseTo(Math.sqrt(3 * 7), 1);
  });

  it("uses breed-specific growth duration when available", () => {
    const aussiedoodle = getBreedPrior("aussiedoodle");
    expect(aussiedoodle.monthsToFullGrown).toBe(14); // breed-specific override

    const chihuahua = getBreedPrior("chihuahua");
    expect(chihuahua.monthsToFullGrown).toBe(9); // falls back to toy size category
  });

  it("matches doodle breeds", () => {
    expect(getBreedPrior("goldendoodle").matched).toBe(true);
    expect(getBreedPrior("labradoodle").matched).toBe(true);
    expect(getBreedPrior("cockapoo").matched).toBe(true);
  });

  it("matches giant breeds", () => {
    const dane = getBreedPrior("great dane");
    expect(dane.matched).toBe(true);
    expect(dane.category).toBe("giant");
    expect(dane.monthsToFullGrown).toBeGreaterThan(18);
  });
});
