"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type ScheduleItem } from "@/db/schema";
import {
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  replaceSchedule,
} from "@/actions/schedule";
import { SCHEDULE_TEMPLATES } from "@/lib/schedule-templates";

interface ScheduleViewProps {
  items: ScheduleItem[];
  canWrite?: boolean;
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
  return Math.abs(nowMinutes - slotMinutes) < 30;
}

const TEMPLATE_EMOJI: Record<string, string> = {
  "young-puppy": "🐾",
  adolescent: "🐕",
  adult: "🦮",
};

// --- Confirmation dialog ---

function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 space-y-4">
        <h3 className="text-base font-semibold text-stone-800">{title}</h3>
        <p className="text-sm text-stone-500">{description}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold"
          >
            Replace schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Inline editable row ---

function EditableItem({
  item,
  isCurrent,
  isLast,
  canWrite,
  isPending,
  onSave,
  onToggle,
  onDelete,
}: {
  item: ScheduleItem;
  isCurrent: boolean;
  isLast: boolean;
  canWrite: boolean;
  isPending: boolean;
  onSave: (id: string, data: { time: string; activity: string }) => void;
  onToggle: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTime, setEditTime] = useState(item.time);
  const [editActivity, setEditActivity] = useState(item.activity);
  const activityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && activityRef.current) {
      activityRef.current.focus();
      activityRef.current.select();
    }
  }, [editing]);

  const commitEdit = useCallback(() => {
    const trimmed = editActivity.trim();
    if (!trimmed) {
      setEditTime(item.time);
      setEditActivity(item.activity);
      setEditing(false);
      return;
    }
    if (trimmed !== item.activity || editTime !== item.time) {
      onSave(item.id, { time: editTime, activity: trimmed });
    }
    setEditing(false);
  }, [editActivity, editTime, item, onSave]);

  const cancelEdit = useCallback(() => {
    setEditTime(item.time);
    setEditActivity(item.activity);
    setEditing(false);
  }, [item]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  return (
    <div className="flex gap-3 relative">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-16 shrink-0">
        {editing ? (
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-16 text-xs font-mono text-center bg-transparent border-b border-amber-400 focus:outline-none"
          />
        ) : (
          <span
            className={`text-xs font-mono ${
              isCurrent ? "text-amber-600 font-bold" : "text-stone-400"
            }`}
          >
            {formatTime12h(item.time)}
          </span>
        )}
        {!isLast && <div className="w-px flex-1 bg-stone-200 my-1" />}
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
        onClick={() => {
          if (canWrite && !editing && !isPending) setEditing(true);
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {canWrite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item);
                }}
                disabled={isPending}
                className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 ${
                  item.enabled
                    ? "border-amber-400 bg-amber-400 text-white"
                    : "border-stone-300"
                }`}
              >
                {item.enabled && "✓"}
              </button>
            )}
            {editing ? (
              <input
                ref={activityRef}
                type="text"
                value={editActivity}
                onChange={(e) => setEditActivity(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm font-medium text-stone-800 bg-transparent border-b border-amber-400 focus:outline-none min-w-0"
              />
            ) : (
              <span
                className={`text-sm font-medium truncate ${
                  item.enabled
                    ? "text-stone-800"
                    : "text-stone-400 line-through"
                }`}
              >
                {item.activity}
              </span>
            )}
          </div>
          {canWrite && !editing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              disabled={isPending}
              className="text-stone-300 hover:text-red-400 text-xs p-1 shrink-0"
            >
              ✕
            </button>
          )}
        </div>
        {item.notes && !editing && (
          <div className="text-xs text-stone-400 mt-1 ml-7">{item.notes}</div>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

export function ScheduleView({ items, canWrite = true }: ScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState("12:00");
  const [newActivity, setNewActivity] = useState("");

  // --- Template actions ---

  function handleApplyTemplate(templateId: string) {
    const template = SCHEDULE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    startTransition(async () => {
      await replaceSchedule(template.items);
      setConfirmTemplate(null);
      router.refresh();
    });
  }

  // --- Item actions ---

  function handleSave(id: string, data: { time: string; activity: string }) {
    startTransition(async () => {
      await updateScheduleItem(id, data);
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

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newActivity.trim()) return;
    startTransition(async () => {
      await addScheduleItem({
        time: newTime,
        activity: newActivity.trim(),
      });
      setNewActivity("");
      setNewTime("12:00");
      setIsAdding(false);
      router.refresh();
    });
  }

  const pendingTemplate = confirmTemplate
    ? SCHEDULE_TEMPLATES.find((t) => t.id === confirmTemplate)
    : null;

  return (
    <div className="space-y-4">
      {/* Template picker */}
      {canWrite && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
            Templates
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SCHEDULE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setConfirmTemplate(template.id)}
                disabled={isPending}
                className="text-left p-3 rounded-xl border border-stone-100 bg-white hover:border-amber-300
                  hover:shadow-sm transition-all disabled:opacity-50 group"
              >
                <span className="text-lg block mb-1">
                  {TEMPLATE_EMOJI[template.id] ?? "📋"}
                </span>
                <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 block">
                  {template.name}
                </span>
                <span className="text-[11px] text-stone-400 block leading-tight mt-0.5">
                  {template.ageRange}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {pendingTemplate && (
        <ConfirmDialog
          title={`Use "${pendingTemplate.name}" template?`}
          description={`This will replace your entire schedule with ${pendingTemplate.items.length} items. ${pendingTemplate.description}.`}
          onConfirm={() => handleApplyTemplate(pendingTemplate.id)}
          onCancel={() => setConfirmTemplate(null)}
        />
      )}

      {/* Timeline */}
      <div className="relative">
        {items.map((item, i) => (
          <EditableItem
            key={item.id}
            item={item}
            isCurrent={isCurrentTimeSlot(item.time)}
            isLast={i === items.length - 1}
            canWrite={canWrite}
            isPending={isPending}
            onSave={handleSave}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-8">
            No schedule items yet. Pick a template above or add items manually.
          </p>
        )}
      </div>

      {/* Add item */}
      {canWrite &&
        (isAdding ? (
          <form
            onSubmit={handleAdd}
            className="flex gap-2 items-center bg-white rounded-xl border border-stone-200 p-3"
          >
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
              placeholder="Activity"
              required
              autoFocus
              className="flex-1 p-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 shrink-0"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-stone-400 hover:text-stone-600 text-sm p-2 shrink-0"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
              hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
          >
            + Add to schedule
          </button>
        ))}
    </div>
  );
}
