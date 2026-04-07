"use server";

import { db } from "@/db";
import { EVENT_TYPES, type EventType, type Event } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";

const eventsCollection = () => db.collection("events");

function docToEvent(doc: FirebaseFirestore.DocumentSnapshot): Event {
  const data = doc.data()!;
  return {
    id: doc.id,
    type: data.type as EventType,
    notes: data.notes || null,
    metadata: data.metadata || null,
    occurredAt: (data.occurredAt as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

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
  const docRef = eventsCollection().doc();
  const event = {
    type,
    notes: notes || null,
    metadata: metadata || null,
    occurredAt: Timestamp.fromDate(occurredAt || now),
    createdAt: Timestamp.fromDate(now),
  };
  await docRef.set(event);
  return { id: docRef.id, ...event, occurredAt: occurredAt || now, createdAt: now };
}

export async function deleteEvent(id: string) {
  await eventsCollection().doc(id).delete();
}

export async function getEventsForDay(date: Date): Promise<Event[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await eventsCollection()
    .where("occurredAt", ">=", Timestamp.fromDate(startOfDay))
    .where("occurredAt", "<=", Timestamp.fromDate(endOfDay))
    .orderBy("occurredAt", "desc")
    .get();

  return snapshot.docs.map(docToEvent);
}

export async function getRecentEvents(limit: number = 20): Promise<Event[]> {
  const snapshot = await eventsCollection()
    .orderBy("occurredAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(docToEvent);
}

export async function getEventsByType(type: EventType, limit: number = 50): Promise<Event[]> {
  const snapshot = await eventsCollection()
    .where("type", "==", type)
    .orderBy("occurredAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(docToEvent);
}

export async function getLastEventOfType(type: EventType): Promise<Event | null> {
  const snapshot = await eventsCollection()
    .where("type", "==", type)
    .orderBy("occurredAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return docToEvent(snapshot.docs[0]);
}

/** Returns the current crate status: whether Toro is in the crate and since when. */
export async function getCrateStatus() {
  const lastCrateIn = await getLastEventOfType("crate_in");

  if (!lastCrateIn) {
    return { inCrate: false, since: null };
  }

  // Check if there's a crate_out after the last crate_in
  const snapshot = await eventsCollection()
    .where("type", "==", "crate_out")
    .where("occurredAt", ">", Timestamp.fromDate(lastCrateIn.occurredAt))
    .orderBy("occurredAt", "desc")
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return { inCrate: false, since: null };
  }

  return { inCrate: true, since: lastCrateIn.occurredAt };
}

export async function getAllEvents(limit: number = 100): Promise<Event[]> {
  const snapshot = await eventsCollection()
    .orderBy("occurredAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(docToEvent);
}

export async function getTodayStats(): Promise<Partial<Record<EventType, number>>> {
  const todayEvents = await getEventsForDay(new Date());
  const counts: Partial<Record<EventType, number>> = {};
  for (const event of todayEvents) {
    counts[event.type] = (counts[event.type] || 0) + 1;
  }
  return counts;
}
