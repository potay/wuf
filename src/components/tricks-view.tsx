"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Trick, type TrickStatus } from "@/db/schema";
import { addTrick, updateTrickStatus, deleteTrick } from "@/actions/tricks";
import { formatDate } from "@/lib/utils";

interface TricksViewProps {
  tricks: Trick[];
  canWrite?: boolean;
}

const STATUS_CONFIG: Record<TrickStatus, { label: string; emoji: string; color: string }> = {
  learning: { label: "Learning", emoji: "📖", color: "bg-amber-100 text-amber-700 border-amber-200" },
  learned: { label: "Learned", emoji: "✅", color: "bg-blue-100 text-blue-700 border-blue-200" },
  mastered: { label: "Mastered", emoji: "⭐", color: "bg-green-100 text-green-700 border-green-200" },
};

const STATUS_ORDER: TrickStatus[] = ["learning", "learned", "mastered"];

const COMMON_TRICKS = [
  "Sit", "Stay", "Down", "Come", "Heel", "Leave it", "Drop it",
  "Shake", "Roll over", "Spin", "Touch", "Wait", "Place", "Off",
  "Quiet", "Speak", "Fetch", "Go to bed",
];

export function TricksView({ tricks, canWrite = true }: TricksViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [customName, setCustomName] = useState("");

  const mastered = tricks.filter((t) => t.status === "mastered");
  const learned = tricks.filter((t) => t.status === "learned");
  const learning = tricks.filter((t) => t.status === "learning");

  const existingNames = new Set(tricks.map((t) => t.name.toLowerCase()));
  const suggestions = COMMON_TRICKS.filter((t) => !existingNames.has(t.toLowerCase()));

  function handleAdd(name: string) {
    startTransition(async () => {
      await addTrick({ name });
      setCustomName("");
      setIsAdding(false);
      router.refresh();
    });
  }

  function handleStatusChange(id: string, status: TrickStatus) {
    startTransition(async () => {
      await updateTrickStatus(id, status);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this trick?")) return;
    startTransition(async () => {
      await deleteTrick(id);
      router.refresh();
    });
  }

  function TrickCard({ trick }: { trick: Trick }) {
    const config = STATUS_CONFIG[trick.status];
    const currentIdx = STATUS_ORDER.indexOf(trick.status);
    const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${config.color}`}>
        <span className="text-xl">{config.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{trick.name}</div>
          <div className="text-xs opacity-70">
            Started {formatDate(trick.startedAt)}
            {trick.masteredAt && ` · Mastered ${formatDate(trick.masteredAt)}`}
          </div>
        </div>
        {canWrite && (
          <div className="flex items-center gap-1">
            {nextStatus && (
              <button
                onClick={() => handleStatusChange(trick.id, nextStatus)}
                disabled={isPending}
                className="px-2 py-1 rounded-lg bg-white/60 text-xs font-medium
                  hover:bg-white transition-colors disabled:opacity-50"
              >
                → {STATUS_CONFIG[nextStatus].label}
              </button>
            )}
            <button
              onClick={() => handleDelete(trick.id)}
              disabled={isPending}
              className="text-current opacity-30 hover:opacity-60 p-1 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Learning", count: learning.length, emoji: "📖" },
          { label: "Learned", count: learned.length, emoji: "✅" },
          { label: "Mastered", count: mastered.length, emoji: "⭐" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-stone-100 p-3 text-center">
            <div className="text-lg">{stat.emoji}</div>
            <div className="text-xl font-bold text-stone-800">{stat.count}</div>
            <div className="text-xs text-stone-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Learning */}
      {learning.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Currently learning ({learning.length})
          </h2>
          <div className="space-y-2">
            {learning.map((t) => <TrickCard key={t.id} trick={t} />)}
          </div>
        </section>
      )}

      {/* Learned */}
      {learned.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Learned ({learned.length})
          </h2>
          <div className="space-y-2">
            {learned.map((t) => <TrickCard key={t.id} trick={t} />)}
          </div>
        </section>
      )}

      {/* Mastered */}
      {mastered.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Mastered ({mastered.length})
          </h2>
          <div className="space-y-2">
            {mastered.map((t) => <TrickCard key={t.id} trick={t} />)}
          </div>
        </section>
      )}

      {/* Add trick */}
      {canWrite && (isAdding ? (
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
          {/* Quick-add suggestions */}
          {suggestions.length > 0 && (
            <div>
              <label className="text-xs text-stone-500 mb-2 block">Quick add</label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAdd(name)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-full bg-stone-100 text-xs font-medium text-stone-600
                      hover:bg-amber-100 hover:text-amber-700 transition-colors disabled:opacity-50"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Custom */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customName.trim()) handleAdd(customName.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Custom trick name"
              className="flex-1 p-2.5 rounded-lg border border-stone-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
            />
            <button
              type="submit"
              disabled={isPending || !customName.trim()}
              className="px-4 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              Add
            </button>
          </form>
          <button
            onClick={() => setIsAdding(false)}
            className="w-full py-2 text-stone-400 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
            hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
        >
          + Add trick
        </button>
      ))}
    </div>
  );
}
