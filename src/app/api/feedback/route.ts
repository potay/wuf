import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  let uid: string | null = null;
  let puppyId: string | null = null;

  try {
    const user = await getCurrentUser();
    uid = user.uid;
    puppyId = user.puppyId;
  } catch {
    // Allow anonymous feedback (user might not be logged in)
  }

  const { rating, text, source } = await request.json();

  await db.collection("feedback").doc().set({
    rating: rating || null,
    text: text || null,
    source: source || "unknown", // "form" | "nps" | "satisfaction"
    uid,
    puppyId,
    createdAt: Timestamp.now(),
    userAgent: request.headers.get("user-agent") || null,
  });

  return NextResponse.json({ success: true });
}
