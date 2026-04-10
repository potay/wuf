import { NextResponse } from "next/server";
import { db } from "@/db";
import { Timestamp } from "firebase-admin/firestore";
import { getWebPush } from "@/lib/web-push";

/** Send push notification to all members of a puppy. */
async function sendToPuppyMembers(puppyId: string, memberUids: string[], payload: { title: string; body: string; tag: string; url?: string }) {
  const webpush = getWebPush();
  const puppyRef = db.collection("puppies").doc(puppyId);

  // Collect all push subscriptions from all members
  for (const uid of memberUids) {
    const subsSnapshot = await db.collection("users").doc(uid).collection("push_subscriptions").get();
    // Also check puppy-level subscriptions
    const puppySubsSnapshot = await puppyRef.collection("push_subscriptions").get();
    const allSubs = [...subsSnapshot.docs, ...puppySubsSnapshot.docs];

    for (const doc of allSubs) {
      const subscription = doc.data();
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          JSON.stringify(payload)
        );
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await doc.ref.delete();
        }
      }
    }
  }
}

async function checkCrateForPuppy(puppyId: string, puppyName: string, memberUids: string[]) {
  const puppyRef = db.collection("puppies").doc(puppyId);
  const eventsCol = puppyRef.collection("events");

  const lastIn = await eventsCol
    .where("type", "==", "crate_in")
    .orderBy("occurredAt", "desc")
    .limit(1)
    .get();

  if (lastIn.empty) return;

  const crateInTime = (lastIn.docs[0].data().occurredAt as Timestamp).toDate();

  const lastOut = await eventsCol
    .where("type", "==", "crate_out")
    .where("occurredAt", ">", Timestamp.fromDate(crateInTime))
    .limit(1)
    .get();

  if (!lastOut.empty) return;

  const elapsedMs = Date.now() - crateInTime.getTime();
  const elapsedMin = elapsedMs / 60_000;

  const pushLogCol = puppyRef.collection("push_log");
  const lastNotif = await pushLogCol
    .where("type", "==", "crate")
    .orderBy("sentAt", "desc")
    .limit(1)
    .get();

  const lastSentMin = lastNotif.empty
    ? Infinity
    : (Date.now() - (lastNotif.docs[0].data().sentAt as Timestamp).toDate().getTime()) / 60_000;

  if (lastSentMin < 30) return;

  if (elapsedMin >= 120) {
    await sendToPuppyMembers(puppyId, memberUids, {
      title: `${puppyName} needs out!`,
      body: `${puppyName} has been in the crate for ${Math.round(elapsedMin)} minutes. Time to let them out!`,
      tag: "crate-urgent",
      url: "/",
    });
    await pushLogCol.doc().set({ type: "crate", sentAt: Timestamp.now() });
  } else if (elapsedMin >= 60) {
    await sendToPuppyMembers(puppyId, memberUids, {
      title: "Crate check-in",
      body: `${puppyName} has been in the crate for ${Math.round(elapsedMin)} minutes. Plan to let them out soon.`,
      tag: "crate-warning",
      url: "/",
    });
    await pushLogCol.doc().set({ type: "crate", sentAt: Timestamp.now() });
  }
}

async function checkScheduleForPuppy(puppyId: string, memberUids: string[]) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const puppyRef = db.collection("puppies").doc(puppyId);
  const scheduleCol = puppyRef.collection("schedule");
  const snapshot = await scheduleCol.where("enabled", "==", true).get();

  const pushLogCol = puppyRef.collection("push_log");

  for (const doc of snapshot.docs) {
    const item = doc.data();
    const [h, m] = (item.time as string).split(":").map(Number);
    const itemMinutes = h * 60 + m;

    if (currentMinutes >= itemMinutes && currentMinutes - itemMinutes < 2) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alreadySent = await pushLogCol
        .where("type", "==", `schedule-${doc.id}`)
        .where("sentAt", ">=", Timestamp.fromDate(today))
        .limit(1)
        .get();

      if (alreadySent.empty) {
        await sendToPuppyMembers(puppyId, memberUids, {
          title: `📅 ${item.activity}`,
          body: item.notes || `It's time for: ${item.activity}`,
          tag: `schedule-${doc.id}`,
          url: "/schedule",
        });
        await pushLogCol.doc().set({
          type: `schedule-${doc.id}`,
          sentAt: Timestamp.now(),
        });
      }
    }
  }
}

/** Called periodically by Cloud Scheduler to check all puppies' notification triggers */
export async function GET() {
  try {
    const puppiesSnapshot = await db.collection("puppies").get();

    for (const puppyDoc of puppiesSnapshot.docs) {
      const puppyId = puppyDoc.id;
      const puppyData = puppyDoc.data();
      const puppyName = puppyData.name || "Puppy";
      const memberUids = (puppyData.members || []).map((m: { uid: string }) => m.uid);

      if (memberUids.length === 0) continue;

      await Promise.all([
        checkCrateForPuppy(puppyId, puppyName, memberUids),
        checkScheduleForPuppy(puppyId, memberUids),
      ]);
    }

    return NextResponse.json({ success: true, puppies: puppiesSnapshot.size, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Push check error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
