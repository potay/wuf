import { describe, it, expect } from "vitest";
import { getDayBoundsInTimezone } from "@/lib/timezone";

describe("getDayBoundsInTimezone", () => {
  it("start is always before end", () => {
    const date = new Date("2026-04-10T15:00:00Z");
    const timezones = ["UTC", "America/Los_Angeles", "America/New_York", "Asia/Tokyo", "Europe/London"];

    for (const tz of timezones) {
      const { start, end } = getDayBoundsInTimezone(date, tz);
      expect(start.getTime()).toBeLessThan(end.getTime());
    }
  });

  it("bounds span approximately 24 hours", () => {
    const date = new Date("2026-04-10T12:00:00Z");
    const timezones = ["UTC", "America/Los_Angeles", "America/New_York", "Asia/Tokyo"];

    for (const tz of timezones) {
      const { start, end } = getDayBoundsInTimezone(date, tz);
      const diffHours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
      expect(diffHours).toBeGreaterThan(23.9);
      expect(diffHours).toBeLessThanOrEqual(24);
    }
  });

  it("the input date falls within the returned bounds", () => {
    const date = new Date("2026-04-10T15:00:00Z");
    const { start, end } = getDayBoundsInTimezone(date, "America/Los_Angeles");

    expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it("different timezones can produce different day bounds for the same UTC time", () => {
    // 3am UTC on April 10 = still April 9 in US Pacific (UTC-7)
    const date = new Date("2026-04-10T03:00:00Z");

    const utcBounds = getDayBoundsInTimezone(date, "UTC");
    const pacificBounds = getDayBoundsInTimezone(date, "America/Los_Angeles");

    // UTC says April 10, Pacific says April 9 - bounds should differ
    expect(utcBounds.start.getTime()).not.toBe(pacificBounds.start.getTime());
  });

  it("same timezone returns same bounds regardless of time within the day", () => {
    const morning = new Date("2026-04-10T08:00:00Z");
    const evening = new Date("2026-04-10T20:00:00Z");

    const morningBounds = getDayBoundsInTimezone(morning, "UTC");
    const eveningBounds = getDayBoundsInTimezone(evening, "UTC");

    expect(morningBounds.start.getTime()).toBe(eveningBounds.start.getTime());
    expect(morningBounds.end.getTime()).toBe(eveningBounds.end.getTime());
  });
});
