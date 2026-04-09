"use server";

import { db } from "@/db";
import { type SocializationItem } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { SOCIALIZATION_CHECKLIST } from "@/lib/socialization-checklist";
import { verifySession } from "@/lib/session";

const collection = () => db.collection("socializations");

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

export async function initializeSocializationChecklist() {
  const existing = await collection().limit(1).get();
  if (!existing.empty) return;

  const batch = db.batch();
  for (const category of SOCIALIZATION_CHECKLIST) {
    for (const item of category.items) {
      const docRef = collection().doc();
      batch.set(docRef, {
        category: category.category,
        label: item,
        completedAt: null,
        notes: null,
      });
    }
  }
  await batch.commit();
}

export async function getAllSocializationItems(): Promise<SocializationItem[]> {
  await initializeSocializationChecklist();
  const snapshot = await collection().orderBy("category").get();
  return snapshot.docs.map(docToItem);
}

export async function toggleSocializationItem(id: string, completed: boolean) {
  await verifySession();
  await collection().doc(id).update({
    completedAt: completed ? Timestamp.fromDate(new Date()) : null,
  });
}

export async function updateSocializationNotes(id: string, notes: string) {
  await verifySession();
  await collection().doc(id).update({ notes: notes || null });
}
