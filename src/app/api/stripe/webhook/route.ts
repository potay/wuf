import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const puppyId = session.metadata?.puppyId;
        if (puppyId && session.subscription) {
          await db.collection("puppies").doc(puppyId).update({
            subscriptionStatus: "active",
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
          });
          console.log(`Subscription activated for puppy ${puppyId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const puppyId = await findPuppyByCustomerId(subscription.customer as string);
        if (puppyId) {
          const status = mapStripeStatus(subscription.status);
          await db.collection("puppies").doc(puppyId).update({
            subscriptionStatus: status,
          });
          console.log(`Subscription updated for puppy ${puppyId}: ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const puppyId = await findPuppyByCustomerId(subscription.customer as string);
        if (puppyId) {
          await db.collection("puppies").doc(puppyId).update({
            subscriptionStatus: "expired",
            stripeSubscriptionId: null,
          });
          console.log(`Subscription cancelled for puppy ${puppyId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const puppyId = await findPuppyByCustomerId(invoice.customer as string);
        if (puppyId) {
          console.log(`Payment failed for puppy ${puppyId}`);
          // Don't immediately expire - Stripe retries. Just log it.
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function findPuppyByCustomerId(customerId: string): Promise<string | null> {
  const snapshot = await db.collection("puppies")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0].id;
}

export function mapStripeStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
    case "unpaid":
      return "expired";
    case "past_due":
    case "incomplete":
      return "active"; // still allow access during grace period
    default:
      return "expired";
  }
}
