import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserCollection } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const subscription = await request.json();
  const col = await getUserCollection("push_subscriptions");

  // Upsert by uid - each user gets ONE subscription (the latest device)
  const existing = await col.where("uid", "==", user.uid).limit(1).get();

  const data = {
    ...subscription,
    uid: user.uid,
    updatedAt: new Date(),
  };

  if (existing.empty) {
    await col.doc().set(data);
  } else {
    await existing.docs[0].ref.set(data); // Replace entirely (new endpoint + keys)
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  await getCurrentUser(); // Verify auth
  const col = await getUserCollection("push_subscriptions");

  const { endpoint } = await request.json();
  const snapshot = await col.where("endpoint", "==", endpoint).limit(1).get();
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.delete();
  }

  return NextResponse.json({ success: true });
}
