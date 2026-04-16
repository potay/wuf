"use server";

import { type Reminder } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import type { ReminderCategory } from "@/lib/reminder-categories";
import { requireWriteAccess, getUserCollection } from "@/lib/session";

function docToReminder(doc: FirebaseFirestore.DocumentSnapshot): Reminder {
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title,
    notes: data.notes || null,
    category: data.category,
    dueAt: (data.dueAt as Timestamp).toDate(),
    repeatInterval: data.repeatInterval || null,
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export async function createReminder(data: {
  title: string;
  notes?: string;
  category: ReminderCategory;
  dueAt: Date;
  repeatInterval?: string;
}) {
  await requireWriteAccess();
  const col = await getUserCollection("reminders");
  const now = new Date();
  const docRef = col.doc();
  const reminder = {
    title: data.title,
    notes: data.notes || null,
    category: data.category,
    dueAt: Timestamp.fromDate(data.dueAt),
    repeatInterval: data.repeatInterval || null,
    completedAt: null,
    createdAt: Timestamp.fromDate(now),
  };
  await docRef.set(reminder);
  return { id: docRef.id, ...reminder, dueAt: data.dueAt, createdAt: now };
}

export async function completeReminder(id: string) {
  await requireWriteAccess();
  const col = await getUserCollection("reminders");
  await col.doc(id).update({
    completedAt: Timestamp.fromDate(new Date()),
  });
}

export async function uncompleteReminder(id: string) {
  await requireWriteAccess();
  const col = await getUserCollection("reminders");
  await col.doc(id).update({
    completedAt: null,
  });
}

export async function deleteReminder(id: string) {
  await requireWriteAccess();
  const col = await getUserCollection("reminders");
  await col.doc(id).delete();
}

export async function getUpcomingReminders(limit: number = 20): Promise<Reminder[]> {
  const col = await getUserCollection("reminders");
  const snapshot = await col
    .where("completedAt", "==", null)
    .orderBy("dueAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map(docToReminder);
}

export async function getOverdueReminders(): Promise<Reminder[]> {
  const col = await getUserCollection("reminders");
  const now = new Date();
  const snapshot = await col
    .where("completedAt", "==", null)
    .where("dueAt", "<=", Timestamp.fromDate(now))
    .orderBy("dueAt", "asc")
    .get();

  return snapshot.docs.map(docToReminder);
}

export async function getAllReminders(): Promise<Reminder[]> {
  const col = await getUserCollection("reminders");
  const snapshot = await col
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(docToReminder);
}

export async function getRemindersByCategory(category: ReminderCategory): Promise<Reminder[]> {
  const col = await getUserCollection("reminders");
  const snapshot = await col
    .where("category", "==", category)
    .orderBy("dueAt", "asc")
    .get();

  return snapshot.docs.map(docToReminder);
}
