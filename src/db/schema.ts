// All event types that can be logged for a puppy
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
  { label: string; emoji: string; bg: string }
> = {
  pee: { label: "Pee", emoji: "💧", bg: "#FEF9C3" },
  poop: { label: "Poop", emoji: "💩", bg: "#FDEBC8" },
  accident: { label: "Accident", emoji: "🚨", bg: "#FEE2E2" },
  meal: { label: "Meal", emoji: "🍖", bg: "#FFEDD5" },
  water: { label: "Water", emoji: "💦", bg: "#DBEAFE" },
  crate_in: { label: "Crate In", emoji: "🏠", bg: "#EDE9FE" },
  crate_out: { label: "Crate Out", emoji: "🐕", bg: "#DCFCE7" },
  walk: { label: "Walk", emoji: "🦮", bg: "#D1FAE5" },
  play: { label: "Play", emoji: "🎾", bg: "#FCE7F3" },
  treat: { label: "Treat", emoji: "🦴", bg: "#FEF3C7" },
  medicine: { label: "Medicine", emoji: "💊", bg: "#FFE4E6" },
  vaccination: { label: "Vaccination", emoji: "💉", bg: "#E0E7FF" },
  vet_visit: { label: "Vet Visit", emoji: "🏥", bg: "#CCFBF1" },
  weight: { label: "Weight", emoji: "⚖️", bg: "#F1F5F9" },
  train: { label: "Train", emoji: "🎓", bg: "#EDE9FE" },
  sleep: { label: "Sleep", emoji: "😴", bg: "#E0E7FF" },
  wake: { label: "Wake Up", emoji: "☀️", bg: "#FEF9C3" },
  note: { label: "Note", emoji: "📝", bg: "#F3F4F6" },
};


export interface Event {
  id: string;
  type: string;
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

export interface MilestoneMedia {
  url: string;
  contentType: string;
  name: string;
}

export interface Milestone {
  id: string;
  title: string;
  notes: string | null;
  photoUrl: string | null;
  media: MilestoneMedia[];
  occurredAt: Date;
  createdAt: Date;
}

export interface UserDoc {
  email: string;
  displayName: string;
  activePuppyId: string | null;
  createdAt: Date;
}

export interface PuppyMember {
  uid: string;
  role: "owner" | "member";
  joinedAt: Date;
}

export type SubscriptionStatus = "trialing" | "active" | "expired" | "cancelled";

export interface CustomEventType {
  id: string;
  label: string;
  emoji: string;
  bg: string;
}

export interface PuppyDoc {
  name: string;
  inviteCode: string;
  members: PuppyMember[];
  createdBy: string;
  createdAt: Date;
  trialEndsAt: Date;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface PuppyProfile {
  name: string;
  breed: string;
  birthday: string | null; // YYYY-MM-DD
  sex: string | null;
  color: string | null;
  photoUrl: string | null;
  illustrationUrl: string | null;
  microchipId: string | null;
  /** Mom's adult weight in lbs, for growth projection */
  momWeightLbs: number | null;
  /** Dad's adult weight in lbs, for growth projection */
  dadWeightLbs: number | null;
  vetName: string | null;
  vetPhone: string | null;
  emergencyVetName: string | null;
  emergencyVetPhone: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  notes: string | null;
  /** Custom event types defined by this puppy's owner */
  customEvents?: CustomEventType[];
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

export type MedicalRecordCategory =
  | "vet_visit"
  | "vaccination"
  | "lab_results"
  | "prescription"
  | "imaging"
  | "other";

export const MEDICAL_RECORD_CATEGORIES: Record<
  MedicalRecordCategory,
  { label: string; emoji: string }
> = {
  vet_visit: { label: "Vet Visit", emoji: "🏥" },
  vaccination: { label: "Vaccination", emoji: "💉" },
  lab_results: { label: "Lab Results", emoji: "🔬" },
  prescription: { label: "Prescription", emoji: "💊" },
  imaging: { label: "X-Ray / Imaging", emoji: "📷" },
  other: { label: "Other", emoji: "📋" },
};

export interface MedicalRecord {
  id: string;
  title: string;
  category: MedicalRecordCategory;
  date: Date;
  notes: string | null;
  files: MedicalRecordFile[];
  createdAt: Date;
}

export interface MedicalRecordFile {
  name: string;
  url: string;
  contentType: string;
  size: number;
}

export interface FeedingDetails {
  food: string;
  amount: string;
  unit: string;
  finished: boolean;
}
