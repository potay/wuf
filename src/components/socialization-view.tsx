"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { type SocializationItem } from "@/db/schema";
import { toggleSocializationItem } from "@/actions/socialization";

interface SocializationViewProps {
  items: SocializationItem[];
}

const CATEGORY_EMOJIS: Record<string, string> = {
  People: "👥",
  Animals: "🐾",
  Surfaces: "🧱",
  Sounds: "🔊",
  Environments: "🏙️",
  Handling: "✋",
  Objects: "📦",
};

export function SocializationView({ items }: SocializationViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Group by category
  const grouped = new Map<string, SocializationItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.category) || [];
    existing.push(item);
    grouped.set(item.category, existing);
  }

  const totalCompleted = items.filter((i) => i.completedAt).length;
  const totalItems = items.length;
  const progressPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  function handleToggle(item: SocializationItem) {
    startTransition(async () => {
      await toggleSocializationItem(item.id, !item.completedAt);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-stone-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">Progress</span>
          <span className="text-sm text-stone-500">
            {totalCompleted}/{totalItems} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      {Array.from(grouped.entries()).map(([category, categoryItems]) => {
        const completed = categoryItems.filter((i) => i.completedAt).length;
        const emoji = CATEGORY_EMOJIS[category] || "📋";

        return (
          <section key={category}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                {emoji} {category}
              </h2>
              <span className="text-xs text-stone-400">
                {completed}/{categoryItems.length}
              </span>
            </div>
            <div className="space-y-1">
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item)}
                  disabled={isPending}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    item.completedAt
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-stone-100 hover:border-amber-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      item.completedAt
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-stone-300"
                    }`}
                  >
                    {item.completedAt && <span className="text-xs">✓</span>}
                  </div>
                  <span
                    className={`text-sm ${
                      item.completedAt
                        ? "text-green-700"
                        : "text-stone-700"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
