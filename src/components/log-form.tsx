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

  // Feeding details
  const [foodName, setFoodName] = useState("");
  const [foodAmount, setFoodAmount] = useState("");
  const [foodUnit, setFoodUnit] = useState("cups");
  const [foodFinished, setFoodFinished] = useState(true);

  const isMeal = selectedType === "meal";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const metadata = isMeal && foodName
      ? JSON.stringify({ food: foodName, amount: foodAmount, unit: foodUnit, finished: foodFinished })
      : undefined;
    startTransition(async () => {
      await logEvent(
        selectedType,
        notes || undefined,
        metadata,
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

      {/* Feeding details */}
      {isMeal && (
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 space-y-3">
          <label className="text-sm font-semibold text-orange-700 uppercase tracking-wide block">
            Feeding details (optional)
          </label>
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="Food name (e.g., Purina Pro Plan)"
            className="w-full p-2.5 rounded-lg border border-orange-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.25"
              min="0"
              value={foodAmount}
              onChange={(e) => setFoodAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 p-2.5 rounded-lg border border-orange-200 bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
            />
            <select
              value={foodUnit}
              onChange={(e) => setFoodUnit(e.target.value)}
              className="p-2.5 rounded-lg border border-orange-200 bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="cups">cups</option>
              <option value="oz">oz</option>
              <option value="grams">grams</option>
              <option value="tbsp">tbsp</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-orange-700">
            <input
              type="checkbox"
              checked={foodFinished}
              onChange={(e) => setFoodFinished(e.target.checked)}
              className="rounded border-orange-300 text-amber-500 focus:ring-amber-300"
            />
            Finished entire meal
          </label>
        </div>
      )}

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
