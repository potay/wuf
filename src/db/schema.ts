// All event types that can be logged for Toro
export const EVENT_TYPES = [
  "pee",
  "poop",
  "accident",
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
  "train",
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
  accident: { label: "Accident", emoji: "🚨", color: "bg-red-100 text-red-800" },
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
  train: { label: "Train", emoji: "🎓", color: "bg-violet-100 text-violet-800" },
  sleep: { label: "Sleep", emoji: "😴", color: "bg-indigo-100 text-indigo-800" },
  wake: { label: "Wake Up", emoji: "☀️", color: "bg-yellow-100 text-yellow-800" },
  note: { label: "Note", emoji: "📝", color: "bg-gray-100 text-gray-800" },
};

// Quick-log buttons shown on dashboard (subset of all types)
export const QUICK_LOG_TYPES: EventType[] = [
  "pee",
  "poop",
  "accident",
  "meal",
  "water",
  "crate_in",
  "crate_out",
  "walk",
  "play",
  "treat",
  "train",
  "sleep",
  "wake",
  "note",
];

export interface Event {
  id: string;
  type: EventType;
  notes: string | null;
  metadata: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  title: string;
  notes: string | null;
  category: string;
  dueAt: Date;
  repeatInterval: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface SocializationItem {
  id: string;
  category: string;
  label: string;
  completedAt: Date | null;
  notes: string | null;
}

export interface ScheduleItem {
  id: string;
  time: string; // HH:mm format
  activity: string;
  notes: string | null;
  enabled: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  notes: string | null;
  photoUrl: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface PuppyProfile {
  name: string;
  breed: string;
  birthday: string | null; // YYYY-MM-DD
  sex: string | null;
  color: string | null;
  microchipId: string | null;
  vetName: string | null;
  vetPhone: string | null;
  emergencyVetName: string | null;
  emergencyVetPhone: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  notes: string | null;
}

export type TrickStatus = "learning" | "learned" | "mastered";

export interface Trick {
  id: string;
  name: string;
  status: TrickStatus;
  startedAt: Date;
  masteredAt: Date | null;
  notes: string | null;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
  notes: string | null;
  createdAt: Date;
}

export interface FeedingDetails {
  food: string;
  amount: string;
  unit: string;
  finished: boolean;
}
