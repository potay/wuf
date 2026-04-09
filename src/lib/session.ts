import "server-only";

import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
// Ensure firebase-admin is initialized
import "@/db";

const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL || "";

export async function createSession(idToken: string) {
  const auth = getAuth();

  // Verify the ID token and check the email
  const decoded = await auth.verifyIdToken(idToken);
  if (ALLOWED_EMAIL && decoded.email !== ALLOWED_EMAIL) {
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

    if (ALLOWED_EMAIL && decoded.email !== ALLOWED_EMAIL) {
      redirect("/login");
    }

    return decoded;
  } catch {
    redirect("/login");
  }
});

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
