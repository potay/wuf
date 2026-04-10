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
  urgency: "ok" | "warn" | "urgent" | "unknown";
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
      else if (elapsedMin >= entry.warningMinutes) urgency = "warn";
      else urgency = "ok";
    }
    return { type: entry.type, elapsed, urgency };
  });
}

const URGENCY_TEXT = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  urgent: "var(--urgent)",
  unknown: "var(--fg-3)",
};

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

  return (
    <div className="wuf-card p-4">
      <div className="grid grid-cols-4 gap-3">
        {entries.map((entry) => {
          const config = EVENT_TYPE_CONFIG[entry.type];
          return (
            <div key={entry.type} className="text-center">
              <div
                className="w-11 h-11 mx-auto rounded-2xl flex items-center justify-center text-lg mb-1.5"
                style={{ background: config.bg }}
              >
                {config.emoji}
              </div>
              <div className="text-[13px] font-extrabold font-mono" style={{ color: URGENCY_TEXT[entry.urgency] }}>
                {entry.elapsed !== null && entry.elapsed > 0
                  ? formatDuration(entry.elapsed)
                  : "---"}
              </div>
              <div className="text-[10px] font-semibold text-[var(--fg-3)] mt-0.5">{config.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
