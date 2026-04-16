"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="wuf-card p-8 text-center max-w-sm w-full">
        <div className="text-4xl mb-3">🐾</div>
        <h2 className="text-[17px] font-bold text-[var(--fg)] mb-1">
          Something went wrong
        </h2>
        <p className="text-[13px] text-[var(--fg-3)] mb-6">
          An error occurred loading this page. Try again or head back to the dashboard.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => unstable_retry()} className="wuf-btn px-5 py-2.5 text-[13px]">
            Try again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload to escape error state */}
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl border text-[13px] font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--fg-2)" }}
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
