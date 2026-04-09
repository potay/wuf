"use server";

import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function signIn(idToken: string) {
  await createSession(idToken);
  redirect("/");
}

export async function signOut() {
  await deleteSession();
  redirect("/login");
}
