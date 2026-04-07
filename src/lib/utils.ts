import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

/** Normalize Date or ISO string to Date. Handles RSC serialization boundary. */
function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true });
}

export function formatTime(date: Date | string): string {
  return format(toDate(date), "h:mm a");
}

export function formatDate(date: Date | string): string {
  const d = toDate(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatDateForInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
