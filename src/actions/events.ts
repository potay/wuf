"use server";

import { db } from "@/db";
import { events, EVENT_TYPES, type EventType } from "@/db/schema";
import { desc, eq, gt, gte, lte, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function logEvent(
  type: EventType,
  notes?: string,
  metadata?: string,
  occurredAt?: Date
) {
  if (!EVENT_TYPES.includes(type)) {
    throw new Error(`Invalid event type: ${type}`);
  }
  const now = new Date();
  const event = {
    id: uuidv4(),
    type,
    notes: notes || null,
    metadata: metadata || null,
    occurredAt: occurredAt || now,
    createdAt: now,
  };
  await db.insert(events).values(event);
  return event;
}

export async function deleteEvent(id: string) {
  await db.delete(events).where(eq(events.id, id));
}

export async function getEventsForDay(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(events)
    .where(and(gte(events.occurredAt, startOfDay), lte(events.occurredAt, endOfDay)))
    .orderBy(desc(events.occurredAt));
}

export async function getRecentEvents(limit: number = 20) {
  return db
    .select()
    .from(events)
    .orderBy(desc(events.occurredAt))
    .limit(limit);
}

export async function getEventsByType(type: EventType, limit: number = 50) {
  return db
    .select()
    .from(events)
    .where(eq(events.type, type))
    .orderBy(desc(events.occurredAt))
    .limit(limit);
}

export async function getLastEventOfType(type: EventType) {
  const result = await db
    .select()
    .from(events)
    .where(eq(events.type, type))
    .orderBy(desc(events.occurredAt))
    .limit(1);
  return result[0] || null;
}

/** Returns the current crate status: whether Toro is in the crate and since when. */
export async function getCrateStatus() {
  const lastCrateEvent = await db
    .select()
    .from(events)
    .where(
      eq(events.type, "crate_in")
    )
    .orderBy(desc(events.occurredAt))
    .limit(1);

  if (lastCrateEvent.length === 0) {
    return { inCrate: false, since: null };
  }

  // Check if there's a crate_out after the last crate_in
  const lastCrateOut = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.type, "crate_out"),
        gt(events.occurredAt, lastCrateEvent[0].occurredAt)
      )
    )
    .orderBy(desc(events.occurredAt))
    .limit(1);

  if (lastCrateOut.length > 0) {
    return { inCrate: false, since: null };
  }

  return { inCrate: true, since: lastCrateEvent[0].occurredAt };
}

export async function getAllEvents(limit: number = 100, offset: number = 0) {
  return db
    .select()
    .from(events)
    .orderBy(desc(events.occurredAt))
    .limit(limit)
    .offset(offset);
}

export async function getTodayStats() {
  const todayEvents = await getEventsForDay(new Date());
  const counts: Partial<Record<EventType, number>> = {};
  for (const event of todayEvents) {
    const type = event.type as EventType;
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}
