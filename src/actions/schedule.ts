"use server";

import { db } from "@/db";
import { type ScheduleItem } from "@/db/schema";
import { verifySession } from "@/lib/session";

const collection = () => db.collection("schedule");

function docToItem(doc: FirebaseFirestore.DocumentSnapshot): ScheduleItem {
  const data = doc.data()!;
  return {
    id: doc.id,
    time: data.time,
    activity: data.activity,
    notes: data.notes || null,
    enabled: data.enabled ?? true,
  };
}

// Default puppy schedule template
const DEFAULT_SCHEDULE: Omit<ScheduleItem, "id">[] = [
  { time: "06:30", activity: "Wake up + potty", notes: "Take outside immediately", enabled: true },
  { time: "07:00", activity: "Breakfast", notes: null, enabled: true },
  { time: "07:15", activity: "Potty after meal", notes: "Usually goes within 15 min of eating", enabled: true },
  { time: "07:30", activity: "Play time", notes: "Supervised play, 15-20 min", enabled: true },
  { time: "08:00", activity: "Crate / nap", notes: "1-2 hour nap", enabled: true },
  { time: "10:00", activity: "Potty break", notes: null, enabled: true },
  { time: "10:15", activity: "Training session", notes: "5-10 min, keep it fun", enabled: true },
  { time: "10:30", activity: "Play time", notes: null, enabled: true },
  { time: "11:00", activity: "Crate / nap", notes: null, enabled: true },
  { time: "12:30", activity: "Lunch", notes: null, enabled: true },
  { time: "12:45", activity: "Potty after meal", notes: null, enabled: true },
  { time: "13:00", activity: "Play time", notes: null, enabled: true },
  { time: "13:30", activity: "Crate / nap", notes: null, enabled: true },
  { time: "15:30", activity: "Potty break", notes: null, enabled: true },
  { time: "15:45", activity: "Walk", notes: "Short walk, age-appropriate", enabled: true },
  { time: "16:15", activity: "Training session", notes: null, enabled: true },
  { time: "16:30", activity: "Play time", notes: null, enabled: true },
  { time: "17:00", activity: "Crate / nap", notes: null, enabled: true },
  { time: "18:30", activity: "Dinner", notes: null, enabled: true },
  { time: "18:45", activity: "Potty after meal", notes: null, enabled: true },
  { time: "19:00", activity: "Play / family time", notes: null, enabled: true },
  { time: "20:00", activity: "Last potty", notes: "Last water before bed too", enabled: true },
  { time: "20:30", activity: "Bedtime crate", notes: null, enabled: true },
];

export async function initializeSchedule() {
  const existing = await collection().limit(1).get();
  if (!existing.empty) return;

  const batch = db.batch();
  for (const item of DEFAULT_SCHEDULE) {
    const docRef = collection().doc();
    batch.set(docRef, item);
  }
  await batch.commit();
}

export async function getSchedule(): Promise<ScheduleItem[]> {
  await initializeSchedule();
  const snapshot = await collection().orderBy("time").get();
  return snapshot.docs.map(docToItem);
}

export async function addScheduleItem(data: {
  time: string;
  activity: string;
  notes?: string;
}) {
  await verifySession();
  const docRef = collection().doc();
  await docRef.set({
    time: data.time,
    activity: data.activity,
    notes: data.notes || null,
    enabled: true,
  });
  return { id: docRef.id, ...data, notes: data.notes || null, enabled: true };
}

export async function updateScheduleItem(id: string, data: Partial<ScheduleItem>) {
  await verifySession();
  const updates: Record<string, unknown> = {};
  if (data.time !== undefined) updates.time = data.time;
  if (data.activity !== undefined) updates.activity = data.activity;
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (data.enabled !== undefined) updates.enabled = data.enabled;
  await collection().doc(id).update(updates);
}

export async function deleteScheduleItem(id: string) {
  await verifySession();
  await collection().doc(id).delete();
}
