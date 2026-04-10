"use server";

import { type PuppyProfile } from "@/db/schema";
import { verifySession, getUserCollection } from "@/lib/session";

const DEFAULT_PROFILE: PuppyProfile = {
  name: "",
  breed: "",
  birthday: null,
  sex: null,
  color: null,
  photoUrl: null,
  illustrationUrl: null,
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
  const col = await getUserCollection("profile");
  const doc = await col.doc("main").get();
  if (!doc.exists) {
    await col.doc("main").set(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  }
  return doc.data() as PuppyProfile;
}

export async function updateProfile(data: Partial<PuppyProfile>) {
  await verifySession();
  const col = await getUserCollection("profile");
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updates[key] = value === "" ? null : value;
  }
  await col.doc("main").update(updates);
}
