"use client";

import { useState, useTransition, useEffect } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase-client";
import { signIn } from "@/actions/auth";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          startTransition(async () => {
            try {
              await signIn(idToken);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign in failed");
            }
          });
        }
      })
      .catch((e) => {
        if (e.code !== "auth/popup-closed-by-user") {
          setError(e.message);
        }
      });
  }, []);

  async function handleSignIn() {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      startTransition(async () => {
        try {
          await signIn(idToken);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Sign in failed");
        }
      });
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string };
      if (
        firebaseError.code === "auth/popup-blocked" ||
        firebaseError.code === "auth/cancelled-popup-request"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          setError((redirectError as { message?: string }).message || "Sign in failed");
        }
      } else if (firebaseError.code !== "auth/popup-closed-by-user") {
        setError(firebaseError.message || "Sign in failed");
      }
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleSignIn}
        disabled={isPending}
        className="w-full h-14 text-[15px] font-bold rounded-2xl bg-white text-[var(--hero)]
          flex items-center justify-center gap-2.5 disabled:opacity-50
          active:scale-[0.97] transition-transform"
      >
        {isPending ? (
          "Signing in..."
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
