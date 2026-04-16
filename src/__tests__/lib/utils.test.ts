import { describe, it, expect } from "vitest";
import { timeAgo, formatTime, formatDate, formatDateTime, formatDuration, formatDateForInput } from "@/lib/utils";

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(59000)).toBe("59s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(60000)).toBe("1m 0s");
    expect(formatDuration(90000)).toBe("1m 30s");
    expect(formatDuration(300000)).toBe("5m 0s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3600000)).toBe("1h 0m");
    expect(formatDuration(5400000)).toBe("1h 30m");
    expect(formatDuration(7200000)).toBe("2h 0m");
  });
});

describe("formatTime", () => {
  it("formats morning time", () => {
    const result = formatTime(new Date("2026-04-10T09:30:00"));
    expect(result).toBe("9:30 AM");
  });

  it("formats afternoon time", () => {
    const result = formatTime(new Date("2026-04-10T14:15:00"));
    expect(result).toBe("2:15 PM");
  });

  it("handles string input (RSC serialization)", () => {
    const result = formatTime("2026-04-10T09:30:00.000Z");
    expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/);
  });
});

describe("formatDate", () => {
  it("formats today", () => {
    const result = formatDate(new Date());
    expect(result).toBe("Today");
  });

  it("formats yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDate(yesterday)).toBe("Yesterday");
  });

  it("formats older dates", () => {
    const result = formatDate(new Date("2026-01-15T12:00:00"));
    expect(result).toBe("Jan 15, 2026");
  });

  it("handles string input", () => {
    const result = formatDate("2026-01-15T12:00:00.000Z");
    expect(result).toBe("Jan 15, 2026");
  });
});

describe("formatDateTime", () => {
  it("combines date and time", () => {
    const result = formatDateTime(new Date("2026-01-15T14:30:00"));
    expect(result).toContain("Jan 15, 2026");
    expect(result).toContain("2:30 PM");
  });
});

describe("timeAgo", () => {
  it("returns a relative time string", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = timeAgo(fiveMinAgo);
    expect(result).toMatch(/\d+ minutes? ago/);
  });
});

describe("formatDateForInput", () => {
  it("returns yyyy-MM-ddTHH:mm format", () => {
    const result = formatDateForInput(new Date("2026-04-10T14:30:00"));
    expect(result).toBe("2026-04-10T14:30");
  });
});
