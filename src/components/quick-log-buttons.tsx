"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "@/actions/events";
import { QUICK_LOG_TYPES, EVENT_TYPE_CONFIG, type EventType } from "@/db/schema";

export function QuickLogButtons() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleLog(type: EventType) {
    startTransition(async () => {
      await logEvent(type);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {QUICK_LOG_TYPES.map((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        return (
          <button
            key={type}
            onClick={() => handleLog(type)}
            className={`flex flex-col items-center gap-1 p-4 rounded-2xl border border-stone-200
              active:scale-95 transition-all hover:shadow-md
              ${config.color}`}
          >
            <span className="text-2xl">{config.emoji}</span>
            <span className="text-xs font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
