export type ReminderCategory =
  | "vaccination"
  | "feeding"
  | "vet"
  | "medication"
  | "general";

export const REMINDER_CATEGORIES: Record<
  ReminderCategory,
  { label: string; emoji: string }
> = {
  vaccination: { label: "Vaccination", emoji: "💉" },
  feeding: { label: "Feeding", emoji: "🍖" },
  vet: { label: "Vet", emoji: "🏥" },
  medication: { label: "Medication", emoji: "💊" },
  general: { label: "General", emoji: "📋" },
};
