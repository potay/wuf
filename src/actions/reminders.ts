"use server";

import { db } from "@/db";
import { reminders } from "@/db/schema";
import { desc, eq, isNull, lte, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { ReminderCategory } from "@/lib/reminder-categories";

export async function createReminder(data: {
  title: string;
  notes?: string;
  category: ReminderCategory;
  dueAt: Date;
  repeatInterval?: string;
}) {
  const now = new Date();
  const reminder = {
    id: uuidv4(),
    title: data.title,
    notes: data.notes || null,
    category: data.category,
    dueAt: data.dueAt,
    repeatInterval: data.repeatInterval || null,
    completedAt: null,
    createdAt: now,
  };
  await db.insert(reminders).values(reminder);
  return reminder;
}

export async function completeReminder(id: string) {
  await db
    .update(reminders)
    .set({ completedAt: new Date() })
    .where(eq(reminders.id, id));
}

export async function uncompleteReminder(id: string) {
  await db
    .update(reminders)
    .set({ completedAt: null })
    .where(eq(reminders.id, id));
}

export async function deleteReminder(id: string) {
  await db.delete(reminders).where(eq(reminders.id, id));
}

export async function getUpcomingReminders(limit: number = 20) {
  return db
    .select()
    .from(reminders)
    .where(isNull(reminders.completedAt))
    .orderBy(reminders.dueAt)
    .limit(limit);
}

export async function getOverdueReminders() {
  const now = new Date();
  return db
    .select()
    .from(reminders)
    .where(and(isNull(reminders.completedAt), lte(reminders.dueAt, now)))
    .orderBy(reminders.dueAt);
}

export async function getAllReminders() {
  return db
    .select()
    .from(reminders)
    .orderBy(desc(reminders.createdAt));
}

export async function getRemindersByCategory(category: ReminderCategory) {
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.category, category))
    .orderBy(reminders.dueAt);
}
