"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "@/actions/events";
import { QUICK_LOG_TYPES, EVENT_TYPE_CONFIG, type EventType } from "@/db/schema";

const TIME_OFFSETS = [
  { label: "Now", minutes: 0 },
  { label: "5m", minutes: 5 },
  { label: "10m", minutes: 10 },
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
] as const;

export function QuickLogButtons() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [offsetMinutes, setOffsetMinutes] = useState(0);
  const [lastLogged, setLastLogged] = useState<string | null>(null);

  function handleLog(type: EventType) {
    const offset = offsetMinutes;
    startTransition(async () => {
      const occurredAt = offset > 0
        ? new Date(Date.now() - offset * 60_000)
        : undefined;
      await logEvent(type, undefined, undefined, occurredAt);
      setLastLogged(`${EVENT_TYPE_CONFIG[type].label}`);
      setOffsetMinutes(0);
      setTimeout(() => setLastLogged(null), 2000);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {lastLogged && (
        <div className="text-center text-[14px] font-bold" style={{ color: "var(--ok)" }}>
          Logged {lastLogged} ✓
        </div>
      )}

      {/* Pastel colored grid - each type gets its own color */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_LOG_TYPES.map((type) => {
          const config = EVENT_TYPE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => handleLog(type)}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: config.bg, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                {config.emoji}
              </div>
              <span className="text-[11px] font-bold text-[var(--fg-2)]">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Time offset */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {TIME_OFFSETS.map((offset) => (
          <button
            key={offset.minutes}
            onClick={() => setOffsetMinutes(offset.minutes)}
            className={`wuf-chip ${
              offsetMinutes === offset.minutes ? "wuf-chip-active" : "wuf-chip-inactive"
            }`}
          >
            {offset.minutes === 0 ? offset.label : `${offset.label} ago`}
          </button>
        ))}
      </div>
    </div>
  );
}
