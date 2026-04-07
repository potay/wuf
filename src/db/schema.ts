import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// All event types that can be logged for Toro
export const EVENT_TYPES = [
  "pee",
  "poop",
  "meal",
  "water",
  "crate_in",
  "crate_out",
  "walk",
  "play",
  "treat",
  "medicine",
  "vaccination",
  "vet_visit",
  "weight",
  "sleep",
  "wake",
  "note",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; emoji: string; color: string }
> = {
  pee: { label: "Pee", emoji: "💧", color: "bg-yellow-100 text-yellow-800" },
  poop: { label: "Poop", emoji: "💩", color: "bg-amber-100 text-amber-800" },
  meal: { label: "Meal", emoji: "🍖", color: "bg-orange-100 text-orange-800" },
  water: { label: "Water", emoji: "💦", color: "bg-blue-100 text-blue-800" },
  crate_in: {
    label: "Crate In",
    emoji: "🏠",
    color: "bg-purple-100 text-purple-800",
  },
  crate_out: {
    label: "Crate Out",
    emoji: "🐕",
    color: "bg-green-100 text-green-800",
  },
  walk: { label: "Walk", emoji: "🦮", color: "bg-emerald-100 text-emerald-800" },
  play: { label: "Play", emoji: "🎾", color: "bg-pink-100 text-pink-800" },
  treat: { label: "Treat", emoji: "🦴", color: "bg-amber-100 text-amber-800" },
  medicine: {
    label: "Medicine",
    emoji: "💊",
    color: "bg-red-100 text-red-800",
  },
  vaccination: {
    label: "Vaccination",
    emoji: "💉",
    color: "bg-indigo-100 text-indigo-800",
  },
  vet_visit: {
    label: "Vet Visit",
    emoji: "🏥",
    color: "bg-teal-100 text-teal-800",
  },
  weight: { label: "Weight", emoji: "⚖️", color: "bg-slate-100 text-slate-800" },
  sleep: { label: "Sleep", emoji: "😴", color: "bg-indigo-100 text-indigo-800" },
  wake: { label: "Wake Up", emoji: "☀️", color: "bg-yellow-100 text-yellow-800" },
  note: { label: "Note", emoji: "📝", color: "bg-gray-100 text-gray-800" },
};

// Quick-log buttons shown on dashboard (subset of all types)
export const QUICK_LOG_TYPES: EventType[] = [
  "pee",
  "poop",
  "meal",
  "water",
  "crate_in",
  "crate_out",
  "walk",
  "play",
  "treat",
  "sleep",
  "wake",
  "note",
];

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  notes: text("notes"),
  metadata: text("metadata"), // JSON string for extra data (weight value, vaccine name, etc.)
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes"),
  category: text("category").notNull().default("general"), // vaccination, feeding, vet, medication, general
  dueAt: integer("due_at", { mode: "timestamp" }).notNull(),
  repeatInterval: text("repeat_interval"), // daily, weekly, monthly, or null for one-time
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
