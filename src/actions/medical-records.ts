"use server";

import { type MedicalRecord, type MedicalRecordCategory, type MedicalRecordFile } from "@/db/schema";
import { Timestamp } from "firebase-admin/firestore";
import { requireWriteAccess, getUserCollection } from "@/lib/session";

function docToRecord(doc: FirebaseFirestore.DocumentSnapshot): MedicalRecord {
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title,
    category: data.category as MedicalRecordCategory,
    date: (data.date as Timestamp).toDate(),
    notes: data.notes || null,
    files: data.files || [],
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
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
  return snapshot.docs.map(docToRecord);
}
