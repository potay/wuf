import { EVENT_TYPE_CONFIG, type EventType, type CustomEventType } from "@/db/schema";

export const UNKNOWN_EVENT_FALLBACK = { label: "Event", emoji: "?", bg: "#F3F4F6" };

export interface EventTypeInfo {
  id: string;
  label: string;
  emoji: string;
  bg: string;
  isCustom: boolean;
}

/** Merge built-in event types with puppy-specific custom types. */
export function getEventTypes(customEvents?: CustomEventType[]): EventTypeInfo[] {
  const builtIn: EventTypeInfo[] = Object.entries(EVENT_TYPE_CONFIG).map(([id, config]) => ({
    id,
    label: config.label,
    emoji: config.emoji,
    bg: config.bg,
    isCustom: false,
  }));

  if (!customEvents || customEvents.length === 0) return builtIn;

  const custom: EventTypeInfo[] = customEvents.map((e) => ({
    id: e.id,
    label: e.label,
    emoji: e.emoji,
    bg: e.bg,
    isCustom: true,
  }));

  return [...builtIn, ...custom];
}

/** Get event type config by ID, checking both built-in and custom. */
export function getEventTypeConfig(
  typeId: string,
  customEvents?: CustomEventType[]
): { label: string; emoji: string; bg: string } | null {
  const builtIn = EVENT_TYPE_CONFIG[typeId as EventType];
  if (builtIn) return { label: builtIn.label, emoji: builtIn.emoji, bg: builtIn.bg };

  const custom = customEvents?.find((e) => e.id === typeId);
  if (custom) return { label: custom.label, emoji: custom.emoji, bg: custom.bg };

  return null;
}

/** The quick-log subset: built-in quick types + all custom types. */
export function getQuickLogTypes(customEvents?: CustomEventType[]): EventTypeInfo[] {
  const QUICK_IDS = [
    "pee", "poop", "accident", "meal", "water", "crate_in", "crate_out",
    "walk", "play", "treat", "train", "sleep", "wake", "note",
  ];

  const builtIn: EventTypeInfo[] = QUICK_IDS.map((id) => {
    const config = EVENT_TYPE_CONFIG[id as EventType];
    return { id, label: config.label, emoji: config.emoji, bg: config.bg, isCustom: false };
  });

  const custom: EventTypeInfo[] = (customEvents || []).map((e) => ({
    id: e.id,
    label: e.label,
    emoji: e.emoji,
    bg: e.bg,
    isCustom: true,
  }));

  return [...builtIn, ...custom];
}
