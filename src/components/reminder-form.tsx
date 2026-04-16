"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReminder } from "@/actions/reminders";
import {
  REMINDER_CATEGORIES,
  type ReminderCategory,
} from "@/lib/reminder-categories";
import { formatDateForInput } from "@/lib/utils";

interface ReminderFormProps {
  canWrite?: boolean;
}

export function ReminderForm({ canWrite = true }: ReminderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<ReminderCategory>("general");
  const [dueAt, setDueAt] = useState(formatDateForInput(new Date()));
  const [repeatInterval, setRepeatInterval] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createReminder({
        title: title.trim(),
        notes: notes || undefined,
        category,
        dueAt: new Date(dueAt),
        repeatInterval: repeatInterval || undefined,
      });
      setTitle("");
      setNotes("");
      setCategory("general");
      setRepeatInterval("");
      setIsOpen(false);
      router.refresh();
    });
  }

  if (!canWrite) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
          hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
      >
        + Add reminder
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4"
    >
      <div>
        <label
          htmlFor="title"
          className="text-xs font-semibold text-stone-500 uppercase tracking-wide"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., DHPP booster vaccine"
          required
          className="mt-1 w-full p-3 rounded-xl border border-stone-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
          Category
        </label>
        <div className="flex gap-2 flex-wrap">
          {(
            Object.entries(REMINDER_CATEGORIES) as [
              ReminderCategory,
              { label: string; emoji: string },
            ][]
          ).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === key
                  ? "bg-amber-500 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="dueAt"
          className="text-xs font-semibold text-stone-500 uppercase tracking-wide"
        >
          Due date
        </label>
        <input
          id="dueAt"
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="mt-1 w-full p-3 rounded-xl border border-stone-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      <div>
        <label
          htmlFor="repeat"
          className="text-xs font-semibold text-stone-500 uppercase tracking-wide"
        >
          Repeat
        </label>
        <select
          id="repeat"
          value={repeatInterval}
          onChange={(e) => setRepeatInterval(e.target.value)}
          className="mt-1 w-full p-3 rounded-xl border border-stone-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="reminderNotes"
          className="text-xs font-semibold text-stone-500 uppercase tracking-wide"
        >
          Notes (optional)
        </label>
        <textarea
          id="reminderNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any details..."
          rows={2}
          className="mt-1 w-full p-3 rounded-xl border border-stone-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium
            hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold
            hover:bg-amber-600 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
