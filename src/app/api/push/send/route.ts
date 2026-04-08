import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:me@paulchun.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function POST(request: NextRequest) {
  const { title, body, tag, url } = await request.json();

  const snapshot = await db.collection("push_subscriptions").get();
  const results: { endpoint: string; success: boolean; error?: string }[] = [];

  for (const doc of snapshot.docs) {
    const subscription = doc.data();
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify({ title, body, tag, url })
      );
      results.push({ endpoint: subscription.endpoint, success: true });
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      // Remove invalid subscriptions (gone/expired)
      if (statusCode === 404 || statusCode === 410) {
        await doc.ref.delete();
      }
      results.push({
        endpoint: subscription.endpoint,
        success: false,
        error: String(error),
      });
    }
  }

  return NextResponse.json({ sent: results.length, results });
}
