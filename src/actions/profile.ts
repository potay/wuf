"use server";

import { db } from "@/db";
import { type PuppyProfile } from "@/db/schema";
import { verifySession } from "@/lib/session";

const PROFILE_DOC = "toro";
const collection = () => db.collection("profile");

const DEFAULT_PROFILE: PuppyProfile = {
  name: "Toro",
  breed: "",
  birthday: null,
  sex: null,
  color: null,
  microchipId: null,
  vetName: null,
  vetPhone: null,
  emergencyVetName: null,
  emergencyVetPhone: null,
  insuranceProvider: null,
  insurancePolicyNumber: null,
  notes: null,
};

export async function getProfile(): Promise<PuppyProfile> {
  const doc = await collection().doc(PROFILE_DOC).get();
  if (!doc.exists) {
    await collection().doc(PROFILE_DOC).set(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  }
  return doc.data() as PuppyProfile;
}

export async function updateProfile(data: Partial<PuppyProfile>) {
  await verifySession();
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updates[key] = value === "" ? null : value;
  }
  await collection().doc(PROFILE_DOC).update(updates);
}
