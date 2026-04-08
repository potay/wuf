import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function POST(request: NextRequest) {
  const subscription = await request.json();

  // Store subscription in Firestore (upsert by endpoint)
  const endpoint = subscription.endpoint;
  const snapshot = await db
    .collection("push_subscriptions")
    .where("endpoint", "==", endpoint)
    .limit(1)
    .get();

  if (snapshot.empty) {
    await db.collection("push_subscriptions").doc().set({
      ...subscription,
      createdAt: new Date(),
    });
  } else {
    await snapshot.docs[0].ref.update(subscription);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { endpoint } = await request.json();

  const snapshot = await db
    .collection("push_subscriptions")
    .where("endpoint", "==", endpoint)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.delete();
  }

  return NextResponse.json({ success: true });
}
