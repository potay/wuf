import { NextResponse } from "next/server";
import { db } from "@/db";
import { Timestamp } from "firebase-admin/firestore";
import { getWebPush } from "@/lib/web-push";

interface NotificationSettings {
  crateAlerts: boolean;
  scheduleAlerts: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  crateAlerts: true,
  scheduleAlerts: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

function isInQuietHours(settings: NotificationSettings): boolean {
  if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = settings.quietHoursStart.split(":").map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  if (startMin <= endMin) {
    return currentMin >= startMin && currentMin < endMin;
  }
  // Wraps midnight (e.g., 22:00 - 07:00)
  return currentMin >= startMin || currentMin < endMin;
}

/** Send push to all members of a puppy, deduped to one device per user. */
async function sendToPuppyMembers(
  puppyId: string,
  payload: { title: string; body: string; tag: string; url?: string },
  alertType: "crate" | "schedule"
) {
  const webpush = getWebPush();
  const puppyRef = db.collection("puppies").doc(puppyId);
  const puppyData = (await puppyRef.get()).data() || {};
  const notifSettings = (puppyData.notificationSettings || {}) as Record<string, NotificationSettings>;

  // Get all subscriptions, dedup by uid (keep most recently updated)
  const subsSnapshot = await puppyRef.collection("push_subscriptions").get();
  const latestByUid = new Map<string, FirebaseFirestore.DocumentSnapshot>();

  for (const doc of subsSnapshot.docs) {
    const data = doc.data();
    const uid = data.uid as string;
    if (!uid) continue;

    const existing = latestByUid.get(uid);
    if (!existing || (data.updatedAt?.toDate?.() > existing.data()?.updatedAt?.toDate?.())) {
      latestByUid.set(uid, doc);
    }
  }

  for (const [uid, doc] of latestByUid) {
    // Check per-user notification settings
    const settings = { ...DEFAULT_SETTINGS, ...(notifSettings[uid] || {}) };

    if (alertType === "crate" && !settings.crateAlerts) continue;
    if (alertType === "schedule" && !settings.scheduleAlerts) continue;
    if (isInQuietHours(settings)) continue;

    const sub = doc.data()!;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      );
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await doc.ref.delete(); // Clean stale subscription
      }
    }
  }
}

async function checkCrateForPuppy(puppyId: string, puppyName: string) {
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
    await sendToPuppyMembers(puppyId, {
      title: `${puppyName} needs out!`,
      body: `${puppyName} has been in the crate for ${Math.round(elapsedMin)} minutes. Time to let them out!`,
      tag: "crate-urgent",
      url: "/",
    }, "crate");
    await pushLogCol.doc().set({ type: "crate", sentAt: Timestamp.now() });
  } else if (elapsedMin >= 60) {
    await sendToPuppyMembers(puppyId, {
      title: "Crate check-in",
      body: `${puppyName} has been in the crate for ${Math.round(elapsedMin)} minutes. Plan to let them out soon.`,
      tag: "crate-warning",
      url: "/",
    }, "crate");
    await pushLogCol.doc().set({ type: "crate", sentAt: Timestamp.now() });
  }
}

async function checkScheduleForPuppy(puppyId: string) {
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
        await sendToPuppyMembers(puppyId, {
          title: `📅 ${item.activity}`,
          body: item.notes || `It's time for: ${item.activity}`,
          tag: `schedule-${doc.id}`,
          url: "/schedule",
        }, "schedule");
        await pushLogCol.doc().set({
          type: `schedule-${doc.id}`,
          sentAt: Timestamp.now(),
        });
      }
    }
  }
}

export async function GET() {
  try {
    const puppiesSnapshot = await db.collection("puppies").get();

    for (const puppyDoc of puppiesSnapshot.docs) {
      const puppyId = puppyDoc.id;
      const puppyData = puppyDoc.data();
      const puppyName = puppyData.name || "Puppy";

      await Promise.all([
        checkCrateForPuppy(puppyId, puppyName),
        checkScheduleForPuppy(puppyId),
      ]);
    }

    return NextResponse.json({ success: true, puppies: puppiesSnapshot.size, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Push check error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
