"use server";

import { db } from "@/db";
import { type PuppyProfile } from "@/db/schema";
import { requireWriteAccess, getCurrentUser } from "@/lib/session";

/** Get the puppy profile, stripping non-serializable Firestore fields. */
export async function getProfile(): Promise<PuppyProfile> {
  const user = await getCurrentUser();
  const doc = await db.collection("puppies").doc(user.puppyId).get();
  const data = doc.data() || {};

  // Only return PuppyProfile fields - strip Firestore-specific fields
  // (members, inviteCode, createdBy, createdAt are Timestamps/arrays that can't serialize)
  return {
    name: data.name || "",
    breed: data.breed || "",
    birthday: data.birthday || null,
    sex: data.sex || null,
    color: data.color || null,
    photoUrl: data.photoUrl || null,
    illustrationUrl: data.illustrationUrl || null,
    microchipId: data.microchipId || null,
    momWeightLbs: typeof data.momWeightLbs === "number" ? data.momWeightLbs : null,
    dadWeightLbs: typeof data.dadWeightLbs === "number" ? data.dadWeightLbs : null,
    vetName: data.vetName || null,
    vetPhone: data.vetPhone || null,
    emergencyVetName: data.emergencyVetName || null,
    emergencyVetPhone: data.emergencyVetPhone || null,
    insuranceProvider: data.insuranceProvider || null,
    insurancePolicyNumber: data.insurancePolicyNumber || null,
    notes: data.notes || null,
  };
}

const NUMERIC_FIELDS = new Set(["momWeightLbs", "dadWeightLbs"]);

export async function updateProfile(data: Partial<PuppyProfile>) {
  await requireWriteAccess();
  const user = await getCurrentUser();
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (NUMERIC_FIELDS.has(key)) {
      // Coerce string inputs from form to numbers (or null if empty/invalid)
      if (value === "" || value === null || value === undefined) {
        updates[key] = null;
      } else {
        const num = typeof value === "number" ? value : parseFloat(String(value));
        updates[key] = isNaN(num) ? null : num;
      }
    } else {
      updates[key] = value === "" ? null : value;
    }
  }
  await db.collection("puppies").doc(user.puppyId).update(updates);
}
