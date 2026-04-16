"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "@/actions/events";
import { type CustomEventType } from "@/db/schema";
import { getQuickLogTypes } from "@/lib/event-types";
import { CustomEventEditor } from "@/components/custom-event-editor";

const TIME_OFFSETS = [
  { label: "Now", minutes: 0 },
  { label: "5m", minutes: 5 },
  { label: "10m", minutes: 10 },
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
] as const;

interface QuickLogButtonsProps {
  canWrite?: boolean;
  customEvents?: CustomEventType[];
}

export function QuickLogButtons({ canWrite = true, customEvents }: QuickLogButtonsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [offsetMinutes, setOffsetMinutes] = useState(0);
  const [lastLogged, setLastLogged] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventTypes = getQuickLogTypes(customEvents);

  function handleLog(typeId: string, label: string) {
    if (!canWrite) return;
    setError(null);
    const offset = offsetMinutes;
    startTransition(async () => {
      try {
        const occurredAt = offset > 0
          ? new Date(Date.now() - offset * 60_000)
          : undefined;
        await logEvent(typeId, undefined, undefined, occurredAt);
        setLastLogged(`${label}${offset > 0 ? ` (${offset}m ago)` : ""}`);
        setOffsetMinutes(0);
        setTimeout(() => setLastLogged(null), 2000);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to log event");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="text-center text-[13px] font-medium px-4 py-2 rounded-xl"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
      {lastLogged && (
        <div className="text-center text-[14px] font-bold" style={{ color: "var(--ok)" }}>
          Logged {lastLogged} ✓
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {eventTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleLog(type.id, type.label)}
            disabled={!canWrite}
            className={`flex flex-col items-center gap-2 transition-transform ${canWrite ? "active:scale-90" : "opacity-40"}`}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: type.bg, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {type.emoji}
            </div>
            <span className="text-[10px] font-bold text-[var(--fg-2)]">{type.label}</span>
          </button>
        ))}

        {/* Add custom event button */}
        {canWrite && (
          <button
            onClick={() => setShowEditor(true)}
            className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 border-dashed"
              style={{ borderColor: "var(--border)", color: "var(--fg-3)" }}
            >
              +
            </div>
            <span className="text-[10px] font-bold text-[var(--fg-3)]">Custom</span>
          </button>
        )}
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

      {/* Custom event editor modal */}
      {showEditor && <CustomEventEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}
