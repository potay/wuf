"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "@/actions/events";
import { EVENT_TYPES, EVENT_TYPE_CONFIG, type EventType } from "@/db/schema";
import { formatDateForInput } from "@/lib/utils";

export function LogForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<EventType>("pee");
  const [notes, setNotes] = useState("");
  const [customTime, setCustomTime] = useState(false);
  const [occurredAt, setOccurredAt] = useState(formatDateForInput(new Date()));
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await logEvent(
        selectedType,
        notes || undefined,
        undefined,
        customTime ? new Date(occurredAt) : undefined
      );
      setNotes("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event type selector */}
      <div>
        <label className="text-sm font-semibold text-stone-600 mb-3 block uppercase tracking-wide">
          Event type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {EVENT_TYPES.map((type) => {
            const config = EVENT_TYPE_CONFIG[type];
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                  ${
                    isSelected
                      ? "border-amber-400 bg-amber-50 shadow-sm"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
              >
                <span className="text-lg">{config.emoji}</span>
                <span className="text-xs font-medium text-stone-600">
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="text-sm font-semibold text-stone-600 mb-2 block uppercase tracking-wide"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any details..."
          rows={2}
          className="w-full p-3 rounded-xl border border-stone-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300
            placeholder:text-stone-300 resize-none"
        />
      </div>

      {/* Custom time */}
      <div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={customTime}
            onChange={(e) => setCustomTime(e.target.checked)}
            className="rounded border-stone-300 text-amber-500 focus:ring-amber-300"
          />
          Set custom time
        </label>
        {customTime && (
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="mt-2 w-full p-3 rounded-xl border border-stone-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-4 rounded-2xl text-white font-semibold text-base transition-all
          active:scale-[0.98] disabled:opacity-50
          ${submitted ? "bg-green-500" : "bg-amber-500 hover:bg-amber-600"}`}
      >
        {submitted ? "Logged! ✓" : isPending ? "Logging..." : `Log ${EVENT_TYPE_CONFIG[selectedType].emoji} ${EVENT_TYPE_CONFIG[selectedType].label}`}
      </button>
    </form>
  );
}
