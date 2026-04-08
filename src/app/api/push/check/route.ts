import { NextResponse } from "next/server";
import { db } from "@/db";
import { Timestamp } from "firebase-admin/firestore";
import { getWebPush } from "@/lib/web-push";

async function sendToAll(payload: { title: string; body: string; tag: string; url?: string }) {
  const webpush = getWebPush();
  const snapshot = await db.collection("push_subscriptions").get();
  for (const doc of snapshot.docs) {
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

/** Check crate status and send notification if overdue */
async function checkCrate() {
  const lastIn = await db
    .collection("events")
    .where("type", "==", "crate_in")
    .orderBy("occurredAt", "desc")
    .limit(1)
    .get();

  if (lastIn.empty) return;

  const crateInTime = (lastIn.docs[0].data().occurredAt as Timestamp).toDate();

  const lastOut = await db
    .collection("events")
    .where("type", "==", "crate_out")
    .where("occurredAt", ">", Timestamp.fromDate(crateInTime))
    .limit(1)
    .get();

  if (!lastOut.empty) return;

  const elapsedMs = Date.now() - crateInTime.getTime();
  const elapsedMin = elapsedMs / 60_000;

  // Check the last notification we sent (avoid spamming)
  const lastNotif = await db
    .collection("push_log")
    .where("type", "==", "crate")
    .orderBy("sentAt", "desc")
    .limit(1)
    .get();

  const lastSentMin = lastNotif.empty
    ? Infinity
    : (Date.now() - (lastNotif.docs[0].data().sentAt as Timestamp).toDate().getTime()) / 60_000;

  if (lastSentMin < 30) return;

  if (elapsedMin >= 120) {
    await sendToAll({
      title: "🚨 Toro needs out!",
      body: `Toro has been in the crate for ${Math.round(elapsedMin)} minutes. Time to let her out!`,
      tag: "crate-urgent",
      url: "/",
    });
    await db.collection("push_log").doc().set({ type: "crate", sentAt: Timestamp.now() });
  } else if (elapsedMin >= 60) {
    await sendToAll({
      title: "🏠 Crate check-in",
      body: `Toro has been in the crate for ${Math.round(elapsedMin)} minutes. Plan to let her out soon.`,
      tag: "crate-warning",
      url: "/",
    });
    await db.collection("push_log").doc().set({ type: "crate", sentAt: Timestamp.now() });
  }
}

/** Check schedule items and send notification if due */
async function checkSchedule() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const snapshot = await db.collection("schedule").where("enabled", "==", true).get();

  for (const doc of snapshot.docs) {
    const item = doc.data();
    const [h, m] = (item.time as string).split(":").map(Number);
    const itemMinutes = h * 60 + m;

    if (currentMinutes >= itemMinutes && currentMinutes - itemMinutes < 2) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alreadySent = await db
        .collection("push_log")
        .where("type", "==", `schedule-${doc.id}`)
        .where("sentAt", ">=", Timestamp.fromDate(today))
        .limit(1)
        .get();

      if (alreadySent.empty) {
        await sendToAll({
          title: `📅 ${item.activity}`,
          body: item.notes || `It's time for: ${item.activity}`,
          tag: `schedule-${doc.id}`,
          url: "/schedule",
        });
        await db.collection("push_log").doc().set({
          type: `schedule-${doc.id}`,
          sentAt: Timestamp.now(),
        });
      }
    }
  }
}

/** Called periodically by Cloud Scheduler to check all notification triggers */
export async function GET() {
  try {
    await Promise.all([checkCrate(), checkSchedule()]);
    return NextResponse.json({ success: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Push check error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
