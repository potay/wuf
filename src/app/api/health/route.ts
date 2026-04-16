import { NextResponse } from "next/server";
import { db } from "@/db";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "me@paulchun.com";

// Track last alert time to avoid spamming (resets on cold start)
let lastAlertSentAt = 0;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

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

  // Log loudly on failure so Cloud Monitoring can pick it up and alert
  if (!allOk && Date.now() - lastAlertSentAt > ALERT_COOLDOWN_MS) {
    lastAlertSentAt = Date.now();
    const failedChecks = Object.entries(checks)
      .filter(([, v]) => !v.ok)
      .map(([k, v]) => `${k}: ${v.error || "failed"}`)
      .join("; ");
    console.error(`[HEALTH_ALERT] admin=${ADMIN_EMAIL} status=degraded checks=${failedChecks}`);
  }

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 500 }
  );
}
