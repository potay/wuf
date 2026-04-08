"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/utils";
import { sendNotification } from "@/components/notification-provider";

interface CrateTimerProps {
  inCrate: boolean;
  since: Date | string | null;
}

const ONE_HOUR = 60 * 60 * 1000;
const TWO_HOURS = 2 * ONE_HOUR;

export function CrateTimer({ inCrate, since }: CrateTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const sinceMs = since ? new Date(since).getTime() : null;
  const notifiedWarning = useRef(false);
  const notifiedUrgent = useRef(false);

  useEffect(() => {
    // Reset notification flags when crate state changes
    notifiedWarning.current = false;
    notifiedUrgent.current = false;
  }, [sinceMs]);

  useEffect(() => {
    if (!inCrate || !sinceMs) return;

    const update = () => {
      const now = Date.now() - sinceMs;
      setElapsed(now);

      // Send notifications at thresholds
      if (now >= TWO_HOURS && !notifiedUrgent.current) {
        notifiedUrgent.current = true;
        sendNotification(
          "🚨 Toro needs out!",
          "Toro has been in the crate for over 2 hours. Time to let her out!"
        );
      } else if (now >= ONE_HOUR && !notifiedWarning.current) {
        notifiedWarning.current = true;
        sendNotification(
          "🏠 Crate check-in",
          "Toro has been in the crate for 1 hour. Plan to let her out soon."
        );
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [inCrate, sinceMs]);

  if (!inCrate) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <div className="text-2xl mb-1">🐕</div>
        <div className="text-sm text-green-700 font-medium">Toro is free!</div>
        <div className="text-xs text-green-600 mt-1">Not in crate</div>
      </div>
    );
  }

  const isLong = elapsed > TWO_HOURS;
  const isWarning = elapsed > ONE_HOUR;

  return (
    <div
      className={`rounded-2xl p-4 text-center border ${
        isLong
          ? "bg-red-50 border-red-200"
          : isWarning
            ? "bg-amber-50 border-amber-200"
            : "bg-purple-50 border-purple-200"
      }`}
    >
      <div className="text-2xl mb-1">🏠</div>
      <div
        className={`text-sm font-medium ${
          isLong
            ? "text-red-700"
            : isWarning
              ? "text-amber-700"
              : "text-purple-700"
        }`}
      >
        In crate
      </div>
      <div
        className={`text-2xl font-bold font-mono mt-1 ${
          isLong
            ? "text-red-800"
            : isWarning
              ? "text-amber-800"
              : "text-purple-800"
        }`}
      >
        {formatDuration(elapsed)}
      </div>
      {isLong && (
        <div className="text-xs text-red-600 mt-1 font-medium">
          Time to let Toro out!
        </div>
      )}
    </div>
  );
}
