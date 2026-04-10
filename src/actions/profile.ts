"use server";

import { db } from "@/db";
import { type PuppyProfile } from "@/db/schema";
import { verifySession, getCurrentUser } from "@/lib/session";

export async function getProfile(): Promise<PuppyProfile> {
  const user = await getCurrentUser();
  const doc = await db.collection("puppies").doc(user.puppyId).get();
  return (doc.data() || {}) as PuppyProfile;
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
