import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { getStripe, WUF_PRO_PRICE_ID } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const stripe = getStripe();

  if (!user.isOwner) {
    return NextResponse.json({ error: "Only the puppy owner can manage billing." }, { status: 403 });
  }

  if (!WUF_PRO_PRICE_ID) {
    return NextResponse.json({ error: "Stripe price not configured." }, { status: 500 });
  }

  const puppyRef = db.collection("puppies").doc(user.puppyId);
  const puppyDoc = await puppyRef.get();
  const puppyData = puppyDoc.data() || {};

  // Reuse existing Stripe customer if we have one
  let customerId = puppyData.stripeCustomerId as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { puppyId: user.puppyId, puppyName: user.puppyName },
    });
    customerId = customer.id;
    await puppyRef.update({ stripeCustomerId: customerId });
  }

  // Use X-Forwarded-Host or Host header for the public URL (Cloud Run sets these)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: WUF_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/billing?success=true`,
    cancel_url: `${baseUrl}/billing?cancelled=true`,
    metadata: { puppyId: user.puppyId },
  });

  return NextResponse.json({ url: session.url });
}
