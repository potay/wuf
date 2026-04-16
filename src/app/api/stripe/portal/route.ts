import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const stripe = getStripe();

  if (!user.isOwner) {
    return NextResponse.json({ error: "Only the puppy owner can manage billing." }, { status: 403 });
  }

  const puppyDoc = await db.collection("puppies").doc(user.puppyId).get();
  const customerId = puppyDoc.data()?.stripeCustomerId;

  if (!customerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 400 });
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
