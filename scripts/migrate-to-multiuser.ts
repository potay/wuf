/**
 * DO NOT RUN - Migration completed. Kept for historical reference only.
 *
 * One-time migration script: copies all top-level Firestore collections
 * into users/{uid}/ subcollections for the specified user.
 *
 * This COPIES data (does not delete originals). Old data stays intact
 * until you manually verify and delete it.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "fattytoro";
const USER_EMAIL = "nanshan7596@gmail.com"; // Paul's primary sign-in email

// All top-level collections to migrate
const COLLECTIONS_TO_MIGRATE = [
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

async function main() {
  // Initialize Firebase Admin
  initializeApp({
    projectId: PROJECT_ID,
    credential: applicationDefault(),
  });

  const auth = getAuth();
  const db = getFirestore();

  // Look up user by email
  console.log(`Looking up user: ${USER_EMAIL}`);
  let uid: string;
  try {
    const userRecord = await auth.getUserByEmail(USER_EMAIL);
    uid = userRecord.uid;
    console.log(`Found user: ${uid} (${userRecord.displayName || "no display name"})`);
  } catch {
    console.error(`User not found for email: ${USER_EMAIL}`);
    console.log("Make sure the user has signed in at least once.");
    process.exit(1);
  }

  const userRef = db.collection("users").doc(uid);

  // Check if user doc already exists
  const existingUser = await userRef.get();
  if (existingUser.exists && existingUser.data()?.onboardingComplete) {
    console.log("User doc already exists with onboardingComplete=true. Skipping user doc creation.");
  } else {
    // Create user doc
    console.log("Creating user doc...");
    await userRef.set({
      email: USER_EMAIL,
      displayName: "Paul",
      createdAt: new Date(),
      onboardingComplete: true,
    });
    console.log("User doc created.");
  }

  // Migrate profile
  console.log("\nMigrating profile...");
  const profileDoc = await db.collection("profile").doc("toro").get();
  if (profileDoc.exists) {
    const profileData = profileDoc.data()!;
    // Add new fields if missing
    if (!profileData.photoUrl) profileData.photoUrl = null;
    if (!profileData.illustrationUrl) profileData.illustrationUrl = null;
    await userRef.collection("profile").doc("main").set(profileData);
    console.log(`  Migrated profile (name: ${profileData.name})`);
  } else {
    console.log("  No profile doc found at profile/toro, skipping.");
  }

  // Migrate each collection
  for (const collectionName of COLLECTIONS_TO_MIGRATE) {
    console.log(`\nMigrating ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`  No documents found, skipping.`);
      continue;
    }

    // Batch write in groups of 500 (Firestore limit)
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const destRef = userRef.collection(collectionName).doc(doc.id);
      batch.set(destRef, doc.data());
      count++;
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} docs...`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`  Migrated ${count} documents.`);
  }

  console.log("\n=== Migration complete ===");
  console.log(`All data copied to users/${uid}/`);
  console.log("Old top-level documents are still intact.");
  console.log("Verify the app works, then manually delete old collections if desired.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
