"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils";

interface CrateTimerProps {
  inCrate: boolean;
  since: Date | string | null;
}

export function CrateTimer({ inCrate, since }: CrateTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const sinceMs = since ? new Date(since).getTime() : null;

  useEffect(() => {
    if (!inCrate || !sinceMs) return;

    const update = () => {
      setElapsed(Date.now() - sinceMs);
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

  const isLong = elapsed > 2 * 60 * 60 * 1000; // > 2 hours
  const isWarning = elapsed > 1 * 60 * 60 * 1000; // > 1 hour

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
