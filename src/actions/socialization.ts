"use server";

import { type SocializationItem } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { requireWriteAccess, getUserCollection } from "@/lib/session";

function docToItem(doc: FirebaseFirestore.DocumentSnapshot): SocializationItem | null {
  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    category: data.category || "",
    label: data.label || "",
    completedAt: data.completedAt?.toDate?.() ?? null,
    notes: data.notes || null,
  };
}

function mapItems(docs: FirebaseFirestore.DocumentSnapshot[]): SocializationItem[] {
  return docs.map(docToItem).filter((i): i is SocializationItem => i !== null);
}

export async function getAllSocializationItems(): Promise<SocializationItem[]> {
  const col = await getUserCollection("socializations");
  const snapshot = await col.orderBy("category").get();
  return mapItems(snapshot.docs);
}

export async function toggleSocializationItem(id: string, completed: boolean) {
  await requireWriteAccess();
  const col = await getUserCollection("socializations");
  await col.doc(id).update({
    completedAt: completed ? Timestamp.fromDate(new Date()) : null,
  });
}

export async function updateSocializationNotes(id: string, notes: string) {
  await requireWriteAccess();
  const col = await getUserCollection("socializations");
  await col.doc(id).update({ notes: notes || null });
}
