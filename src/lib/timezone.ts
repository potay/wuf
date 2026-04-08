import { cookies } from "next/headers";

/** Get the user's IANA timezone from the cookie, fallback to UTC. */
export async function getUserTimezone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("tz")?.value || "UTC";
}

/** Get the start and end of "today" in the user's local timezone, as UTC Dates. */
export function getDayBoundsInTimezone(date: Date, timezone: string): { start: Date; end: Date } {
  // Format the date in the user's timezone to get their local date string
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateStr = formatter.format(date); // e.g., "2026-04-07"

  // Parse back to UTC timestamps for the start and end of that local day
  // Create dates at midnight and 23:59:59 in the target timezone
  const startLocal = new Date(`${localDateStr}T00:00:00`);
  const endLocal = new Date(`${localDateStr}T23:59:59.999`);

  // Get the offset for this timezone at these times
  const startOffset = getTimezoneOffsetMs(startLocal, timezone);
  const endOffset = getTimezoneOffsetMs(endLocal, timezone);

  return {
    start: new Date(startLocal.getTime() + startOffset),
    end: new Date(endLocal.getTime() + endOffset),
  };
}

/** Get the offset in ms between UTC and the given timezone at the given time. */
function getTimezoneOffsetMs(date: Date, timezone: string): number {
  // Format the date in both UTC and the target timezone
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: timezone });
  // The difference is the offset
  return new Date(utcStr).getTime() - new Date(tzStr).getTime();
}
