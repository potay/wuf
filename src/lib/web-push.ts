import webpush from "web-push";

let initialized = false;

/** Lazily initialize web-push with VAPID details. Only call at runtime, not build time. */
export function getWebPush() {
  if (!initialized) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      throw new Error("VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
    }
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:me@paulchun.com",
      publicKey,
      privateKey
    );
    initialized = true;
  }
  return webpush;
}
