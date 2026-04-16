"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type Event,
  type CustomEventType,
} from "@/db/schema";
import { getEventTypes, getEventTypeConfig, UNKNOWN_EVENT_FALLBACK } from "@/lib/event-types";
import { deleteEvent, updateEventTime, updateEventNotes } from "@/actions/events";
import { formatTime, formatDate, formatDateForInput } from "@/lib/utils";

interface HistoryListProps {
  initialEvents: Event[];
  canWrite?: boolean;
  customEvents?: CustomEventType[];
}

export function HistoryList({ initialEvents, canWrite = true, customEvents }: HistoryListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");
  const allEventTypes = getEventTypes(customEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredEvents =
    filter === "all"
      ? initialEvents
      : initialEvents.filter((e) => e.type === filter);

  // Group events by date
  const grouped = new Map<string, Event[]>();
  for (const event of filteredEvents) {
    const dateKey = formatDate(event.occurredAt);
    const existing = grouped.get(dateKey) || [];
    existing.push(event);
    grouped.set(dateKey, existing);
  }

  function handleEdit(event: Event) {
    setEditingId(event.id);
    setEditTime(formatDateForInput(new Date(event.occurredAt)));
    setEditNotes(event.notes || "");
  }

  function handleSave(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateEventTime(id, new Date(editTime));
        const original = initialEvents.find((e) => e.id === id);
        if ((original?.notes || "") !== editNotes) {
          await updateEventNotes(id, editNotes);
        }
        setEditingId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save changes");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteEvent(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete event");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="text-[13px] font-medium px-4 py-2 rounded-xl text-center"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-amber-500 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          All
        </button>
        {allEventTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilter(type.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === type.id
                ? "bg-amber-500 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {type.emoji} {type.label}
          </button>
        ))}
      </div>

      {/* Events grouped by date */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <div className="text-3xl mb-2">🐾</div>
          <p className="text-sm">No events found</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([dateLabel, dayEvents]) => (
          <div key={dateLabel}>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              {dateLabel}
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => {
                const config = getEventTypeConfig(event.type, customEvents) ?? UNKNOWN_EVENT_FALLBACK;
                const isEditing = editingId === event.id;

                if (isEditing) {
                  return (
                    <div
                      key={event.id}
                      className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ background: config.bg }}
                        >
                          {config.emoji}
                        </div>
                        <span className="text-sm font-medium text-stone-800">{config.label}</span>
                      </div>
                      <input
                        type="datetime-local"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full p-2 rounded-lg border border-amber-200 bg-white text-sm
                          focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        className="w-full p-2 rounded-lg border border-amber-200 bg-white text-sm
                          focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-500 text-xs font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(event.id)}
                          disabled={isPending}
                          className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          {isPending ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: config.bg }}
                    >
                      {config.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800">
                        {config.label}
                      </div>
                      {event.notes && (
                        <div className="text-xs text-stone-500 truncate">
                          {event.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 text-right shrink-0">
                      {formatTime(event.occurredAt)}
                    </div>
                    {canWrite && (
                      <button
                        onClick={() => handleEdit(event)}
                        disabled={isPending}
                        className="text-stone-300 hover:text-amber-500 transition-colors p-1 disabled:opacity-50"
                        aria-label="Edit event"
                      >
                        ✏️
                      </button>
                    )}
                    {canWrite && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={isPending}
                        className="text-stone-300 hover:text-red-400 transition-colors p-1 disabled:opacity-50"
                        aria-label="Delete event"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
