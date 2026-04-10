"use server";

import { type ScheduleItem } from "@/db/schema";
import { verifySession, getUserCollection } from "@/lib/session";

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

export async function getSchedule(): Promise<ScheduleItem[]> {
  const col = await getUserCollection("schedule");
  const snapshot = await col.orderBy("time").get();
  return snapshot.docs.map(docToItem);
}

export async function addScheduleItem(data: {
  time: string;
  activity: string;
  notes?: string;
}) {
  await verifySession();
  const col = await getUserCollection("schedule");
  const docRef = col.doc();
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
  const col = await getUserCollection("schedule");
  const updates: Record<string, unknown> = {};
  if (data.time !== undefined) updates.time = data.time;
  if (data.activity !== undefined) updates.activity = data.activity;
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (data.enabled !== undefined) updates.enabled = data.enabled;
  await col.doc(id).update(updates);
}

export async function deleteScheduleItem(id: string) {
  await verifySession();
  const col = await getUserCollection("schedule");
  await col.doc(id).delete();
}
