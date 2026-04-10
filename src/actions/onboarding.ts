"use server";

import { db } from "@/db";
import { verifySession } from "@/lib/session";
import { Timestamp } from "firebase-admin/firestore";
import { redirect } from "next/navigation";
import { SOCIALIZATION_CHECKLIST } from "@/lib/socialization-checklist";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I/L)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const DEFAULT_SCHEDULE: { time: string; activity: string; notes: string | null }[] = [
  { time: "06:30", activity: "Wake up + potty", notes: "Take outside immediately" },
  { time: "07:00", activity: "Breakfast", notes: null },
  { time: "07:15", activity: "Potty after meal", notes: "Usually goes within 15 min of eating" },
  { time: "07:30", activity: "Play time", notes: "Supervised play, 15-20 min" },
  { time: "08:00", activity: "Crate / nap", notes: "1-2 hour nap" },
  { time: "10:00", activity: "Potty break", notes: null },
  { time: "10:15", activity: "Training session", notes: "5-10 min, keep it fun" },
  { time: "10:30", activity: "Play time", notes: null },
  { time: "11:00", activity: "Crate / nap", notes: null },
  { time: "12:30", activity: "Lunch", notes: null },
  { time: "12:45", activity: "Potty after meal", notes: null },
  { time: "13:00", activity: "Play time", notes: null },
  { time: "13:30", activity: "Crate / nap", notes: null },
  { time: "15:30", activity: "Potty break", notes: null },
  { time: "15:45", activity: "Walk", notes: "Short walk, age-appropriate" },
  { time: "16:15", activity: "Training session", notes: null },
  { time: "16:30", activity: "Play time", notes: null },
  { time: "17:00", activity: "Crate / nap", notes: null },
  { time: "18:30", activity: "Dinner", notes: null },
  { time: "18:45", activity: "Potty after meal", notes: null },
  { time: "19:00", activity: "Play / family time", notes: null },
  { time: "20:00", activity: "Last potty", notes: "Last water before bed too" },
  { time: "20:30", activity: "Bedtime crate", notes: null },
];

/** Create a new puppy and link the current user as owner. */
export async function completeOnboarding(data: {
  name: string;
  breed?: string;
  birthday?: string;
  sex?: string;
}) {
  const session = await verifySession();
  const uid = session.uid;
  const now = Timestamp.fromDate(new Date());

  // Create puppy doc
  const puppyRef = db.collection("puppies").doc();
  const inviteCode = generateInviteCode();

  await puppyRef.set({
    name: data.name,
    breed: data.breed || "",
    birthday: data.birthday || null,
    sex: data.sex || null,
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
    inviteCode,
    createdBy: uid,
    members: [{ uid, role: "owner", joinedAt: new Date() }],
    createdAt: now,
  });

  // Create/update user doc pointing to this puppy
  await db.collection("users").doc(uid).set({
    email: session.email || "",
    displayName: session.name || "",
    activePuppyId: puppyRef.id,
    createdAt: now,
  }, { merge: true });

  // Initialize default schedule
  const scheduleBatch = db.batch();
  for (const item of DEFAULT_SCHEDULE) {
    const docRef = puppyRef.collection("schedule").doc();
    scheduleBatch.set(docRef, { ...item, enabled: true });
  }
  await scheduleBatch.commit();

  // Initialize socialization checklist
  const socialBatch = db.batch();
  for (const category of SOCIALIZATION_CHECKLIST) {
    for (const item of category.items) {
      const docRef = puppyRef.collection("socializations").doc();
      socialBatch.set(docRef, {
        category: category.category,
        label: item,
        completedAt: null,
        notes: null,
      });
    }
  }
  await socialBatch.commit();

  redirect("/");
}

/** Join an existing puppy via invite code. */
export async function joinPuppy(inviteCode: string) {
  const session = await verifySession();
  const uid = session.uid;
  const code = inviteCode.trim().toUpperCase();

  // Look up puppy by invite code
  const snapshot = await db.collection("puppies")
    .where("inviteCode", "==", code)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("Invalid invite code. Please check and try again.");
  }

  const puppyDoc = snapshot.docs[0];
  const puppyData = puppyDoc.data();

  // Check if user is already a member
  const alreadyMember = (puppyData.members || []).some(
    (m: { uid: string }) => m.uid === uid
  );

  if (!alreadyMember) {
    // Add user to members
    await puppyDoc.ref.update({
      members: [...(puppyData.members || []), { uid, role: "member", joinedAt: new Date() }],
    });
  }

  // Set as active puppy
  await db.collection("users").doc(uid).set({
    email: session.email || "",
    displayName: session.name || "",
    activePuppyId: puppyDoc.id,
    createdAt: Timestamp.fromDate(new Date()),
  }, { merge: true });

  redirect("/");
}
