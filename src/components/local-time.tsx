"use client";

import { formatTime, formatDate, formatDateTime, timeAgo } from "@/lib/utils";

type Format = "time" | "date" | "datetime" | "ago";

interface LocalTimeProps {
  date: Date | string;
  format?: Format;
}

const FORMATTERS: Record<Format, (date: Date | string) => string> = {
  time: formatTime,
  date: formatDate,
  datetime: formatDateTime,
  ago: timeAgo,
};

export function LocalTime({ date, format = "time" }: LocalTimeProps) {
  return <>{FORMATTERS[format](date)}</>;
}
