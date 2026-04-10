"use server";

import { type SocializationItem } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { verifySession, getUserCollection } from "@/lib/session";

function docToItem(doc: FirebaseFirestore.DocumentSnapshot): SocializationItem {
  const data = doc.data()!;
  return {
    id: doc.id,
    category: data.category,
    label: data.label,
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
    notes: data.notes || null,
  };
}

export async function getAllSocializationItems(): Promise<SocializationItem[]> {
  const col = await getUserCollection("socializations");
  const snapshot = await col.orderBy("category").get();
  return snapshot.docs.map(docToItem);
}

export async function toggleSocializationItem(id: string, completed: boolean) {
  await verifySession();
  const col = await getUserCollection("socializations");
  await col.doc(id).update({
    completedAt: completed ? Timestamp.fromDate(new Date()) : null,
  });
}

export async function updateSocializationNotes(id: string, notes: string) {
  await verifySession();
  const col = await getUserCollection("socializations");
  await col.doc(id).update({ notes: notes || null });
}
