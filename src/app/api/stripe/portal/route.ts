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

  const { origin } = new URL(request.url);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
