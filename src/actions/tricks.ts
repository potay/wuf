"use server";

import { type Trick, type TrickStatus } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { verifySession, getUserCollection } from "@/lib/session";

function docToTrick(doc: FirebaseFirestore.DocumentSnapshot): Trick {
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    status: data.status as TrickStatus,
    startedAt: (data.startedAt as Timestamp).toDate(),
    masteredAt: data.masteredAt ? (data.masteredAt as Timestamp).toDate() : null,
    notes: data.notes || null,
  };
}

export async function addTrick(data: { name: string; notes?: string }) {
  await verifySession();
  const col = await getUserCollection("tricks");
  const docRef = col.doc();
  const now = new Date();
  const trick = {
    name: data.name,
    status: "learning" as TrickStatus,
    startedAt: Timestamp.fromDate(now),
    masteredAt: null,
    notes: data.notes || null,
  };
  await docRef.set(trick);
  return { id: docRef.id, ...trick, startedAt: now };
}

export async function updateTrickStatus(id: string, status: TrickStatus) {
  await verifySession();
  const col = await getUserCollection("tricks");
  const updates: Record<string, unknown> = { status };
  if (status === "mastered") {
    updates.masteredAt = Timestamp.fromDate(new Date());
  } else {
    updates.masteredAt = null;
  }
  await col.doc(id).update(updates);
}

export async function deleteTrick(id: string) {
  await verifySession();
  const col = await getUserCollection("tricks");
  await col.doc(id).delete();
}

export async function getAllTricks(): Promise<Trick[]> {
  const col = await getUserCollection("tricks");
  const snapshot = await col.orderBy("startedAt", "desc").get();
  return snapshot.docs.map(docToTrick);
}
