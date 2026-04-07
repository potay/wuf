"use server";

import { db } from "@/db";
import { type Milestone } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";

const collection = () => db.collection("milestones");

function docToMilestone(doc: FirebaseFirestore.DocumentSnapshot): Milestone {
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title,
    notes: data.notes || null,
    photoUrl: data.photoUrl || null,
    occurredAt: (data.occurredAt as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export async function createMilestone(data: {
  title: string;
  notes?: string;
  photoUrl?: string;
  occurredAt?: Date;
}) {
  const now = new Date();
  const docRef = collection().doc();
  const milestone = {
    title: data.title,
    notes: data.notes || null,
    photoUrl: data.photoUrl || null,
    occurredAt: Timestamp.fromDate(data.occurredAt || now),
    createdAt: Timestamp.fromDate(now),
  };
  await docRef.set(milestone);
  return { id: docRef.id, ...milestone, occurredAt: data.occurredAt || now, createdAt: now };
}

export async function deleteMilestone(id: string) {
  await collection().doc(id).delete();
}

export async function getAllMilestones(): Promise<Milestone[]> {
  const snapshot = await collection()
    .orderBy("occurredAt", "desc")
    .get();
  return snapshot.docs.map(docToMilestone);
}
