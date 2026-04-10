import { NextRequest, NextResponse } from "next/server";
import { getUserCollection } from "@/lib/session";

export async function POST(request: NextRequest) {
  const subscription = await request.json();
  const col = await getUserCollection("push_subscriptions");

  // Upsert by endpoint
  const endpoint = subscription.endpoint;
  const snapshot = await col.where("endpoint", "==", endpoint).limit(1).get();

  if (snapshot.empty) {
    await col.doc().set({ ...subscription, createdAt: new Date() });
  } else {
    await snapshot.docs[0].ref.update(subscription);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { endpoint } = await request.json();
  const col = await getUserCollection("push_subscriptions");

  const snapshot = await col.where("endpoint", "==", endpoint).limit(1).get();
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.delete();
  }

  return NextResponse.json({ success: true });
}
