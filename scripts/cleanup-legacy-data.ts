/**
 * ONE-TIME CLEANUP: Delete legacy top-level Firestore collections and
 * user-level subcollections left over from pre-puppy-centric migrations.
 *
 * All data now lives under puppies/{puppyId}/ subcollections.
 * These top-level collections are orphaned and no longer read or written.
 *
 * Usage: npx tsx scripts/cleanup-legacy-data.ts [--dry-run]
 *
 * DO NOT RUN AGAIN after initial cleanup.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "fattytoro";

// Top-level collections from the original single-user era
const TOP_LEVEL_COLLECTIONS = [
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

// User-level subcollections that were intermediate migration artifacts
const USER_SUBCOLLECTIONS = [
  "profile",
  "events",
  "schedule",
  "reminders",
  "medications",
  "milestones",
  "tricks",
  "socializations",
  "medical_records",
  "push_subscriptions",
];

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const dryRun = process.argv.includes("--dry-run");

async function deleteCollection(ref: FirebaseFirestore.CollectionReference) {
  const snapshot = await ref.limit(500).get();
  if (snapshot.empty) return 0;

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  // Recurse for large collections
  if (snapshot.size === 500) {
    return 500 + await deleteCollection(ref);
  }
  return snapshot.size;
}

async function main() {
  if (dryRun) {
    console.log("=== DRY RUN (no deletes) ===\n");
  }

  let totalDeleted = 0;

  // 1. Clean up top-level collections
  console.log("--- Top-level collections ---");
  for (const name of TOP_LEVEL_COLLECTIONS) {
    const ref = db.collection(name);
    const snapshot = await ref.limit(1).get();
    const count = snapshot.empty ? 0 : (await ref.count().get()).data().count;
    console.log(`  ${name}: ${count} docs`);

    if (!dryRun && count > 0) {
      const deleted = await deleteCollection(ref);
      totalDeleted += deleted;
      console.log(`    -> deleted ${deleted} docs`);
    }
  }

  // 2. Clean up user-level subcollections
  console.log("\n--- User subcollections ---");
  const usersSnapshot = await db.collection("users").get();
  for (const userDoc of usersSnapshot.docs) {
    console.log(`  user: ${userDoc.id}`);

    for (const sub of USER_SUBCOLLECTIONS) {
      const ref = userDoc.ref.collection(sub);
      const snapshot = await ref.limit(1).get();
      if (snapshot.empty) continue;

      const count = (await ref.count().get()).data().count;
      console.log(`    ${sub}: ${count} docs`);

      if (!dryRun && count > 0) {
        const deleted = await deleteCollection(ref);
        totalDeleted += deleted;
        console.log(`      -> deleted ${deleted} docs`);
      }
    }
  }

  console.log(`\n${dryRun ? "Would delete" : "Deleted"} ${totalDeleted} total docs.`);
}

main().catch(console.error);
