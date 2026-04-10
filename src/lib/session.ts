import "server-only";

import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { type PuppyProfile } from "@/db/schema";

const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || process.env.ALLOWED_EMAIL || "")
  .split("|")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function createSession(idToken: string) {
  const auth = getAuth();
  const decoded = await auth.verifyIdToken(idToken);

  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(decoded.email?.toLowerCase() || "")) {
    throw new Error("Unauthorized: this account is not allowed.");
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_MS / 1000,
  });

  return decoded;
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  try {
    const auth = getAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(decoded.email?.toLowerCase() || "")) {
      redirect("/login");
    }

    return decoded;
  } catch {
    redirect("/login");
  }
});

/** Get the active puppy ID for the current user. Redirects to /onboarding if not set. */
const getActivePuppyId = cache(async (): Promise<string> => {
  const session = await verifySession();
  const userDoc = await db.collection("users").doc(session.uid).get();

  if (!userDoc.exists || !userDoc.data()?.activePuppyId) {
    redirect("/onboarding");
  }

  return userDoc.data()!.activePuppyId as string;
});

/** Get the current user + their active puppy's profile. */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const puppyId = await getActivePuppyId();

  const puppyDoc = await db.collection("puppies").doc(puppyId).get();
  const puppyData = puppyDoc.data() || {};

  return {
    uid: session.uid,
    email: session.email || "",
    puppyId,
    puppyName: (puppyData.name as string) || "Puppy",
    inviteCode: (puppyData.inviteCode as string) || "",
    profile: puppyData as PuppyProfile,
  };
});

/** Get a reference to the active puppy's subcollection. All data lives under the puppy. */
export async function getUserCollection(collectionName: string) {
  const puppyId = await getActivePuppyId();
  return db.collection("puppies").doc(puppyId).collection(collectionName);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
