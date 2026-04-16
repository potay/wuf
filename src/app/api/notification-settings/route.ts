import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const settings = await request.json();

  // Store per-user notification settings on the puppy doc
  await db.collection("puppies").doc(user.puppyId).update({
    [`notificationSettings.${user.uid}`]: {
      crateAlerts: settings.crateAlerts ?? true,
      scheduleAlerts: settings.scheduleAlerts ?? true,
      quietHoursStart: settings.quietHoursStart || null,
      quietHoursEnd: settings.quietHoursEnd || null,
    },
  });

  return NextResponse.json({ success: true });
}
