import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requireWriteAccess } from "@/lib/session";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const user = await requireWriteAccess();
  const { id, label, emoji, bg } = await request.json();

  if (!id || !label || !emoji || !bg) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Add to the puppy's customEvents array
  await db.collection("puppies").doc(user.puppyId).update({
    customEvents: FieldValue.arrayUnion({ id, label, emoji, bg }),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await requireWriteAccess();
  const { id } = await request.json();

  // Remove from customEvents array
  const puppyDoc = await db.collection("puppies").doc(user.puppyId).get();
  const customEvents = puppyDoc.data()?.customEvents || [];
  const updated = customEvents.filter((e: { id: string }) => e.id !== id);

  await db.collection("puppies").doc(user.puppyId).update({
    customEvents: updated,
  });

  return NextResponse.json({ success: true });
}
