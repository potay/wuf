"use server";

import { type Medication } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { requireWriteAccess, getUserCollection } from "@/lib/session";

function docToMedication(doc: FirebaseFirestore.DocumentSnapshot): Medication | null {
  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    name: data.name || "",
    dosage: data.dosage || "",
    frequency: data.frequency || "",
    startDate: data.startDate?.toDate?.() ?? new Date(0),
    endDate: data.endDate?.toDate?.() ?? null,
    active: data.active ?? true,
    notes: data.notes || null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
  };
}

function mapMedications(docs: FirebaseFirestore.DocumentSnapshot[]): Medication[] {
  return docs.map(docToMedication).filter((m): m is Medication => m !== null);
}

export async function addMedication(data: {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}) {
  await requireWriteAccess();
  const col = await getUserCollection("medications");
  const docRef = col.doc();
  const now = new Date();
  const medication = {
    name: data.name,
    dosage: data.dosage,
    frequency: data.frequency,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    active: true,
    notes: data.notes || null,
    createdAt: Timestamp.fromDate(now),
  };
  await docRef.set(medication);
  return { id: docRef.id, ...medication, startDate: data.startDate, createdAt: now };
}

export async function toggleMedicationActive(id: string, active: boolean) {
  await requireWriteAccess();
  const col = await getUserCollection("medications");
  await col.doc(id).update({ active });
}

export async function deleteMedication(id: string) {
  await requireWriteAccess();
  const col = await getUserCollection("medications");
  await col.doc(id).delete();
}

export async function getAllMedications(): Promise<Medication[]> {
  const col = await getUserCollection("medications");
  const snapshot = await col.orderBy("createdAt", "desc").get();
  return mapMedications(snapshot.docs);
}
