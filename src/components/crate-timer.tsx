"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/utils";
import { sendNotification } from "@/components/notification-provider";

interface CrateTimerProps {
  inCrate: boolean;
  since: Date | string | null;
  puppyName?: string;
}

const ONE_HOUR = 60 * 60 * 1000;
const TWO_HOURS = 2 * ONE_HOUR;

export function CrateTimer({ inCrate, since, puppyName = "Puppy" }: CrateTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const sinceMs = since ? new Date(since).getTime() : null;
  const notifiedWarning = useRef(false);
  const notifiedUrgent = useRef(false);

  useEffect(() => {
    notifiedWarning.current = false;
    notifiedUrgent.current = false;
  }, [sinceMs]);

  useEffect(() => {
    if (!inCrate || !sinceMs) return;
    const update = () => {
      const now = Date.now() - sinceMs;
      setElapsed(now);
      if (now >= TWO_HOURS && !notifiedUrgent.current) {
        notifiedUrgent.current = true;
        sendNotification(`${puppyName} needs out!`, `${puppyName} has been in the crate for over 2 hours.`);
      } else if (now >= ONE_HOUR && !notifiedWarning.current) {
        notifiedWarning.current = true;
        sendNotification("Crate check-in", `${puppyName} has been in the crate for 1 hour.`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [inCrate, sinceMs, puppyName]);

  const isLong = elapsed > TWO_HOURS;
  const isWarning = elapsed > ONE_HOUR;

  // Designed for dark hero background
  const statusBg = !inCrate
    ? "rgba(34,197,94,0.15)"
    : isLong
      ? "rgba(239,68,68,0.2)"
      : isWarning
        ? "rgba(245,158,11,0.2)"
        : "rgba(255,255,255,0.1)";

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: statusBg }}>
      <span className="text-2xl">{inCrate ? "🏠" : "🐕"}</span>
      <div className="flex-1">
        <div className="text-[14px] font-bold text-white">
          {inCrate ? "In crate" : "{puppyName} is free!"}
        </div>
        {inCrate && isLong && (
          <div className="text-[11px] font-semibold text-red-300">Time to let them out!</div>
        )}
      </div>
      {inCrate && (
        <div className="text-[22px] font-extrabold font-mono text-white">
          {formatDuration(elapsed)}
        </div>
      )}
    </div>
  );
}
