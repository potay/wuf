/**
 * DO NOT RUN - Migration completed. Kept for historical reference only.
 *
 * Migration: move data from users/{uid}/ subcollections to puppies/{puppyId}/ subcollections.
 * Creates a puppy doc with the profile data, invite code, and members list.
 * Updates the user doc with activePuppyId.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "fattytoro";
const USER_UID = "d4fuMVsJb1dUrGP1PYMEdfbq1842"; // Paul's uid (nanshan7596@gmail.com)

const SUBCOLLECTIONS = [
  "events",
  "schedule",
  "reminders",
  "medications",
  "milestones",
  "tricks",
  "socializations",
  "medical_records",
  "push_subscriptions",
  "push_log",
];

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function main() {
  initializeApp({ projectId: PROJECT_ID, credential: applicationDefault() });
  const db = getFirestore();

  const userRef = db.collection("users").doc(USER_UID);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.error("User doc not found. Run the previous migration first.");
    process.exit(1);
  }

  // Read profile from users/{uid}/profile/main
  const profileDoc = await userRef.collection("profile").doc("main").get();
  if (!profileDoc.exists) {
    console.error("Profile doc not found at users/{uid}/profile/main");
    process.exit(1);
  }

  const profileData = profileDoc.data()!;
  const inviteCode = generateInviteCode();

  // Create puppy doc
  const puppyRef = db.collection("puppies").doc();
  console.log(`Creating puppy doc: puppies/${puppyRef.id}`);
  console.log(`  Name: ${profileData.name}`);
  console.log(`  Invite code: ${inviteCode}`);

  await puppyRef.set({
    ...profileData,
    inviteCode,
    createdBy: USER_UID,
    members: [{ uid: USER_UID, role: "owner", joinedAt: new Date() }],
    createdAt: Timestamp.now(),
  });

  // Copy subcollections from users/{uid}/ to puppies/{puppyId}/
  for (const collectionName of SUBCOLLECTIONS) {
    console.log(`\nMigrating ${collectionName}...`);
    const snapshot = await userRef.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`  No documents, skipping.`);
      continue;
    }

    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const destRef = puppyRef.collection(collectionName).doc(doc.id);
      batch.set(destRef, doc.data());
      count++;
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount}...`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`  Migrated ${count} documents.`);
  }

  // Update user doc with activePuppyId
  console.log(`\nUpdating user doc with activePuppyId: ${puppyRef.id}`);
  await userRef.update({ activePuppyId: puppyRef.id });

  console.log("\n=== Migration complete ===");
  console.log(`Puppy ID: ${puppyRef.id}`);
  console.log(`Invite code: ${inviteCode}`);
  console.log(`Data copied from users/${USER_UID}/ to puppies/${puppyRef.id}/`);
  console.log("Old user subcollection data is still intact.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
