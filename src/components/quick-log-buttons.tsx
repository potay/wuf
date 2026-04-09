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
  { label: "1h", minutes: 60 },
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
      setLastLogged(`${EVENT_TYPE_CONFIG[type].emoji} ${EVENT_TYPE_CONFIG[type].label}${offsetMinutes > 0 ? ` (${offsetMinutes}m ago)` : ""}`);
      setOffsetMinutes(0);
      setTimeout(() => setLastLogged(null), 2000);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {/* Time offset selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TIME_OFFSETS.map((offset) => (
          <button
            key={offset.minutes}
            onClick={() => setOffsetMinutes(offset.minutes)}
            className={`wuf-chip ${
              offsetMinutes === offset.minutes
                ? "wuf-chip-active"
                : "wuf-chip-inactive"
            }`}
          >
            {offset.minutes === 0 ? offset.label : `${offset.label} ago`}
          </button>
        ))}
      </div>

      {/* Logged confirmation */}
      {lastLogged && (
        <div className="text-center text-sm text-green-600 font-medium">
          Logged {lastLogged} ✓
        </div>
      )}

      {/* Event buttons */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_LOG_TYPES.map((type) => {
          const config = EVENT_TYPE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => handleLog(type)}
              className={`flex flex-col items-center gap-1 p-4 wuf-card
                ${config.color}`}
            >
              <span className="text-2xl">{config.emoji}</span>
              <span className="text-xs font-medium">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
