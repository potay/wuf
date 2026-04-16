import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Check Firestore connectivity
  const firestoreStart = Date.now();
  try {
    await db.collection("puppies").limit(1).get();
    checks.firestore = { ok: true, latencyMs: Date.now() - firestoreStart };
  } catch (error) {
    checks.firestore = { ok: false, latencyMs: Date.now() - firestoreStart, error: String(error) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 500 }
  );
}
