"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ScheduleItem } from "@/db/schema";
import {
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from "@/actions/schedule";

interface ScheduleViewProps {
  items: ScheduleItem[];
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function isCurrentTimeSlot(time: string): boolean {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = h * 60 + m;
  // Current if within 30 min of the slot
  return Math.abs(nowMinutes - slotMinutes) < 30;
}

export function ScheduleView({ items }: ScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState("12:00");
  const [newActivity, setNewActivity] = useState("");
  const [newNotes, setNewNotes] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newActivity.trim()) return;
    startTransition(async () => {
      await addScheduleItem({
        time: newTime,
        activity: newActivity.trim(),
        notes: newNotes || undefined,
      });
      setNewActivity("");
      setNewNotes("");
      setIsAdding(false);
      router.refresh();
    });
  }

  function handleToggle(item: ScheduleItem) {
    startTransition(async () => {
      await updateScheduleItem(item.id, { enabled: !item.enabled });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this from the schedule?")) return;
    startTransition(async () => {
      await deleteScheduleItem(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {items.map((item, i) => {
          const isCurrent = isCurrentTimeSlot(item.time);
          return (
            <div key={item.id} className="flex gap-3 relative">
              {/* Timeline line */}
              <div className="flex flex-col items-center w-16 shrink-0">
                <span className={`text-xs font-mono ${isCurrent ? "text-amber-600 font-bold" : "text-stone-400"}`}>
                  {formatTime12h(item.time)}
                </span>
                {i < items.length - 1 && (
                  <div className="w-px flex-1 bg-stone-200 my-1" />
                )}
              </div>

              {/* Card */}
              <div
                className={`flex-1 mb-2 p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-amber-50 border-amber-200 shadow-sm"
                    : item.enabled
                      ? "bg-white border-stone-100"
                      : "bg-stone-50 border-stone-100 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={isPending}
                      className={`w-5 h-5 rounded border flex items-center justify-center text-xs
                        ${item.enabled ? "border-amber-400 bg-amber-400 text-white" : "border-stone-300"}`}
                    >
                      {item.enabled && "✓"}
                    </button>
                    <span className={`text-sm font-medium ${item.enabled ? "text-stone-800" : "text-stone-400 line-through"}`}>
                      {item.activity}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                    className="text-stone-300 hover:text-red-400 text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
                {item.notes && (
                  <div className="text-xs text-stone-400 mt-1 ml-7">
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add item */}
      {isAdding ? (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="p-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Activity name"
              required
              className="flex-1 p-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
            />
          </div>
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full p-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
            hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
        >
          + Add to schedule
        </button>
      )}
    </div>
  );
}
