"use server";

import { db } from "@/db";
import { type PuppyProfile } from "@/db/schema";
import { verifySession, getCurrentUser } from "@/lib/session";

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
    vetName: data.vetName || null,
    vetPhone: data.vetPhone || null,
    emergencyVetName: data.emergencyVetName || null,
    emergencyVetPhone: data.emergencyVetPhone || null,
    insuranceProvider: data.insuranceProvider || null,
    insurancePolicyNumber: data.insurancePolicyNumber || null,
    notes: data.notes || null,
  };
}

export async function updateProfile(data: Partial<PuppyProfile>) {
  await verifySession();
  const user = await getCurrentUser();
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updates[key] = value === "" ? null : value;
  }
  await db.collection("puppies").doc(user.puppyId).update(updates);
}
