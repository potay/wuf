"use server";

import { db } from "@/db";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function signIn(idToken: string) {
  const decoded = await createSession(idToken);

  // Check if user has an active puppy
  const userDoc = await db.collection("users").doc(decoded.uid).get();
  if (userDoc.exists && userDoc.data()?.activePuppyId) {
    redirect("/");
  } else {
    redirect("/onboarding");
  }
}

export async function signOut() {
  await deleteSession();
  redirect("/login");
}
