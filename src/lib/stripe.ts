import "server-only";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

/** The Stripe Price ID for the $3/month Wuf Pro plan. Set via env or hardcode after creating in Stripe. */
export const WUF_PRO_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
