"use server";

import { type Milestone, type MilestoneMedia } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { requireWriteAccess, getUserCollection } from "@/lib/session";

function docToMilestone(doc: FirebaseFirestore.DocumentSnapshot): Milestone {
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title,
    notes: data.notes || null,
    photoUrl: data.photoUrl || null,
    media: data.media || [],
    occurredAt: (data.occurredAt as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export async function createMilestone(data: {
  title: string;
  notes?: string;
  media?: MilestoneMedia[];
  occurredAt?: Date;
}) {
  await requireWriteAccess();
  const col = await getUserCollection("milestones");
  const now = new Date();
  const docRef = col.doc();
  const milestone = {
    title: data.title,
    notes: data.notes || null,
    photoUrl: data.media?.[0]?.url || null,
    media: data.media || [],
    occurredAt: Timestamp.fromDate(data.occurredAt || now),
    createdAt: Timestamp.fromDate(now),
  };
  await docRef.set(milestone);
  return { id: docRef.id, ...milestone, occurredAt: data.occurredAt || now, createdAt: now };
}

export async function deleteMilestone(id: string) {
  await requireWriteAccess();
  const col = await getUserCollection("milestones");
  await col.doc(id).delete();
}

export async function getAllMilestones(): Promise<Milestone[]> {
  const col = await getUserCollection("milestones");
  const snapshot = await col
    .orderBy("occurredAt", "desc")
    .get();
  return snapshot.docs.map(docToMilestone);
}
