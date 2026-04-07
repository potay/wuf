"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  completeReminder,
  uncompleteReminder,
  deleteReminder,
} from "@/actions/reminders";
import {
  REMINDER_CATEGORIES,
  type ReminderCategory,
} from "@/lib/reminder-categories";
import { type Reminder } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";

interface RemindersListProps {
  reminders: Reminder[];
}

export function RemindersList({ reminders }: RemindersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const pending = reminders.filter((r) => !r.completedAt);
  const completed = reminders.filter((r) => r.completedAt);

  function handleToggle(reminder: Reminder) {
    startTransition(async () => {
      if (reminder.completedAt) {
        await uncompleteReminder(reminder.id);
      } else {
        await completeReminder(reminder.id);
      }
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this reminder?")) return;
    startTransition(async () => {
      await deleteReminder(id);
      router.refresh();
    });
  }

  function ReminderCard({ reminder }: { reminder: Reminder }) {
    const categoryConfig =
      REMINDER_CATEGORIES[reminder.category as ReminderCategory] ||
      REMINDER_CATEGORIES.general;
    const isOverdue =
      !reminder.completedAt && new Date(reminder.dueAt) < new Date();

    return (
      <div
        className={`flex items-start gap-3 p-3 bg-white rounded-xl border ${
          isOverdue ? "border-red-200" : "border-stone-100"
        }`}
      >
        <button
          onClick={() => handleToggle(reminder)}
          disabled={isPending}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            reminder.completedAt
              ? "bg-green-500 border-green-500 text-white"
              : "border-stone-300 hover:border-amber-400"
          }`}
        >
          {reminder.completedAt && <span className="text-xs">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium ${
              reminder.completedAt
                ? "text-stone-400 line-through"
                : "text-stone-800"
            }`}
          >
            {categoryConfig.emoji} {reminder.title}
          </div>
          <div
            className={`text-xs mt-0.5 ${
              isOverdue ? "text-red-500 font-medium" : "text-stone-400"
            }`}
          >
            {isOverdue ? "Overdue - " : ""}
            {formatDateTime(reminder.dueAt)}
            {reminder.repeatInterval && (
              <span className="text-stone-300">
                {" "}
                · Repeats {reminder.repeatInterval}
              </span>
            )}
          </div>
          {reminder.notes && (
            <div className="text-xs text-stone-400 mt-1 truncate">
              {reminder.notes}
            </div>
          )}
        </div>
        <button
          onClick={() => handleDelete(reminder.id)}
          disabled={isPending}
          className="text-stone-300 hover:text-red-400 transition-colors p-1 disabled:opacity-50"
          aria-label="Delete reminder"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Upcoming ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Completed ({completed.length})
          </h2>
          <div className="space-y-2">
            {completed.map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
          </div>
        </section>
      )}

      {reminders.length === 0 && (
        <div className="text-center py-8 text-stone-400">
          <div className="text-3xl mb-2">🔔</div>
          <p className="text-sm">No reminders yet</p>
        </div>
      )}
    </div>
  );
}
