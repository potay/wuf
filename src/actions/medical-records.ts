"use server";

import { type MedicalRecord, type MedicalRecordCategory, type MedicalRecordFile } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { requireWriteAccess, getUserCollection } from "@/lib/session";

function docToRecord(doc: FirebaseFirestore.DocumentSnapshot): MedicalRecord | null {
  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    title: data.title || "",
    category: (data.category as MedicalRecordCategory) || "other",
    date: data.date?.toDate?.() ?? new Date(0),
    notes: data.notes || null,
    files: data.files || [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
  };
}

function mapRecords(docs: FirebaseFirestore.DocumentSnapshot[]): MedicalRecord[] {
  return docs.map(docToRecord).filter((r): r is MedicalRecord => r !== null);
}

export async function createMedicalRecord(data: {
  title: string;
  category: MedicalRecordCategory;
  date: Date;
  notes?: string;
  files: MedicalRecordFile[];
}) {
  await requireWriteAccess();
  const col = await getUserCollection("medical_records");
  const now = new Date();
  const docRef = col.doc();
  const record = {
    title: data.title,
    category: data.category,
    date: Timestamp.fromDate(data.date),
    notes: data.notes || null,
    files: data.files,
    createdAt: Timestamp.fromDate(now),
  };
  await docRef.set(record);
  return { id: docRef.id, ...data, createdAt: now };
}

export async function deleteMedicalRecord(id: string) {
  await requireWriteAccess();
  const col = await getUserCollection("medical_records");
  await col.doc(id).delete();
}

export async function getAllMedicalRecords(): Promise<MedicalRecord[]> {
  const col = await getUserCollection("medical_records");
  const snapshot = await col.orderBy("date", "desc").get();
  return mapRecords(snapshot.docs);
}
