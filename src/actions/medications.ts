"use server";

import { db } from "@/db";
import { type Medication } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";

const collection = () => db.collection("medications");

function docToMedication(doc: FirebaseFirestore.DocumentSnapshot): Medication {
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    dosage: data.dosage,
    frequency: data.frequency,
    startDate: (data.startDate as Timestamp).toDate(),
    endDate: data.endDate ? (data.endDate as Timestamp).toDate() : null,
    active: data.active ?? true,
    notes: data.notes || null,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export async function addMedication(data: {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}) {
  const docRef = collection().doc();
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
  await collection().doc(id).update({ active });
}

export async function deleteMedication(id: string) {
  await collection().doc(id).delete();
}

export async function getAllMedications(): Promise<Medication[]> {
  const snapshot = await collection().orderBy("createdAt", "desc").get();
  return snapshot.docs.map(docToMedication);
}
