"use client";

import { useEffect, useRef } from "react";
import { sendNotification } from "@/components/notification-provider";
import { type ScheduleItem } from "@/db/schema";

interface ScheduleNotifierProps {
  items: ScheduleItem[];
}

/** Checks schedule items against current time and sends notifications when they're due. */
export function ScheduleNotifier({ items }: ScheduleNotifierProps) {
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Reset notified set at midnight
    const resetAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ms = tomorrow.getTime() - now.getTime();
      return setTimeout(() => {
        notifiedIds.current.clear();
      }, ms);
    };
    const midnightTimer = resetAtMidnight();

    const check = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const item of items) {
        if (!item.enabled) continue;
        if (notifiedIds.current.has(item.id)) continue;

        const [h, m] = item.time.split(":").map(Number);
        const itemMinutes = h * 60 + m;

        // Notify if we're within 2 minutes of the scheduled time
        if (currentMinutes >= itemMinutes && currentMinutes - itemMinutes < 2) {
          notifiedIds.current.add(item.id);
          sendNotification(
            `📅 ${item.activity}`,
            item.notes || `It's time for: ${item.activity}`
          );
        }
      }
    };

    check();
    const interval = setInterval(check, 60_000);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimer);
    };
  }, [items]);

  // This component renders nothing - it only manages notifications
  return null;
}
