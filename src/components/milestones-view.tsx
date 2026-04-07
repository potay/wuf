"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Milestone } from "@/db/schema";
import { createMilestone, deleteMilestone } from "@/actions/milestones";
import { formatDateTime } from "@/lib/utils";

interface MilestonesViewProps {
  milestones: Milestone[];
}

export function MilestonesView({ milestones }: MilestonesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createMilestone({
        title: title.trim(),
        notes: notes || undefined,
      });
      setTitle("");
      setNotes("");
      setIsAdding(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this milestone?")) return;
    startTransition(async () => {
      await deleteMilestone(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Add milestone */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What happened? e.g., First walk outside"
            required
            className="w-full p-3 rounded-xl border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details (optional)"
            rows={2}
            className="w-full p-3 rounded-xl border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save milestone"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
            hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
        >
          + Add milestone
        </button>
      )}

      {/* Milestones list */}
      {milestones.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <div className="text-3xl mb-2">📸</div>
          <p className="text-sm">No milestones yet</p>
          <p className="text-xs mt-1">Record Toro&apos;s firsts and special moments!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-white rounded-xl border border-stone-100 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <h3 className="text-sm font-semibold text-stone-800">
                      {milestone.title}
                    </h3>
                  </div>
                  {milestone.notes && (
                    <p className="text-xs text-stone-500 mt-1 ml-7">
                      {milestone.notes}
                    </p>
                  )}
                  <p className="text-xs text-stone-400 mt-2 ml-7">
                    {formatDateTime(milestone.occurredAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(milestone.id)}
                  disabled={isPending}
                  className="text-stone-300 hover:text-red-400 text-xs p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
