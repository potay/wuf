"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils";
import { type EventType, EVENT_TYPE_CONFIG } from "@/db/schema";

const TRACKED = [
  { type: "pee" as EventType, warningMinutes: 120, urgentMinutes: 180 },
  { type: "poop" as EventType, warningMinutes: 240, urgentMinutes: 360 },
  { type: "meal" as EventType, warningMinutes: 300, urgentMinutes: 420 },
  { type: "water" as EventType, warningMinutes: 120, urgentMinutes: 240 },
];

interface TimeSinceProps {
  lastEvents: Partial<Record<EventType, Date | string | null>>;
}

interface ComputedEntry {
  type: EventType;
  elapsed: number | null;
  urgency: "ok" | "warning" | "urgent" | "unknown";
}

function computeEntries(
  lastEvents: Partial<Record<EventType, Date | string | null>>,
  now: number
): ComputedEntry[] {
  return TRACKED.map((entry) => {
    const lastDate = lastEvents[entry.type];
    const elapsed = lastDate ? now - new Date(lastDate).getTime() : null;
    const elapsedMin = elapsed !== null && elapsed > 0 ? elapsed / 60_000 : null;

    let urgency: ComputedEntry["urgency"] = "unknown";
    if (elapsedMin !== null) {
      if (elapsedMin >= entry.urgentMinutes) urgency = "urgent";
      else if (elapsedMin >= entry.warningMinutes) urgency = "warning";
      else urgency = "ok";
    }

    return { type: entry.type, elapsed, urgency };
  });
}

export function TimeSince({ lastEvents }: TimeSinceProps) {
  const [entries, setEntries] = useState<ComputedEntry[]>(
    () => TRACKED.map((e) => ({ type: e.type, elapsed: null, urgency: "unknown" as const }))
  );

  useEffect(() => {
    const update = () => setEntries(computeEntries(lastEvents, Date.now()));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [lastEvents]);

  const colors = {
    ok: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    urgent: "bg-red-50 border-red-200 text-red-700",
    unknown: "bg-stone-50 border-stone-200 text-stone-400",
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map((entry) => {
        const config = EVENT_TYPE_CONFIG[entry.type];
        return (
          <div
            key={entry.type}
            className={`rounded-xl border p-3 ${colors[entry.urgency]}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{config.emoji}</span>
              <span className="text-xs font-semibold uppercase">{config.label}</span>
            </div>
            <div className="text-lg font-bold font-mono">
              {entry.elapsed !== null && entry.elapsed > 0
                ? formatDuration(entry.elapsed)
                : "---"}
            </div>
            <div className="text-xs opacity-70">
              {entry.urgency === "urgent"
                ? "Overdue!"
                : entry.urgency === "warning"
                  ? "Due soon"
                  : entry.urgency === "ok"
                    ? "On track"
                    : "No data"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
