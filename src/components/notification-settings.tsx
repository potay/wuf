"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface NotificationSettingsProps {
  settings: {
    crateAlerts: boolean;
    scheduleAlerts: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  };
  canWrite: boolean;
}

export function NotificationSettings({ settings, canWrite }: NotificationSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [crate, setCrate] = useState(settings.crateAlerts);
  const [schedule, setSchedule] = useState(settings.scheduleAlerts);
  const [quietStart, setQuietStart] = useState(settings.quietHoursStart || "");
  const [quietEnd, setQuietEnd] = useState(settings.quietHoursEnd || "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await fetch("/api/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crateAlerts: crate,
          scheduleAlerts: schedule,
          quietHoursStart: quietStart || null,
          quietHoursEnd: quietEnd || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-4">
      <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
        🔔 Notifications
      </h2>

      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-[13px] text-stone-700">Crate timer alerts</span>
          <input
            type="checkbox"
            checked={crate}
            onChange={(e) => setCrate(e.target.checked)}
            disabled={!canWrite}
            className="rounded border-stone-300"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-[13px] text-stone-700">Schedule reminders</span>
          <input
            type="checkbox"
            checked={schedule}
            onChange={(e) => setSchedule(e.target.checked)}
            disabled={!canWrite}
            className="rounded border-stone-300"
          />
        </label>

        <div>
          <span className="text-[13px] text-stone-700 block mb-2">Quiet hours (no notifications)</span>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              disabled={!canWrite}
              placeholder="Start"
              className="flex-1 p-2 rounded-lg border border-stone-200 text-sm"
            />
            <span className="text-stone-400 text-xs">to</span>
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              disabled={!canWrite}
              placeholder="End"
              className="flex-1 p-2 rounded-lg border border-stone-200 text-sm"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending || !canWrite}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50
          ${saved ? "bg-green-500 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
      >
        {saved ? "Saved ✓" : isPending ? "Saving..." : "Save notification settings"}
      </button>
    </div>
  );
}
