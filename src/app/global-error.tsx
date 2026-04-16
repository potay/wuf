"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#FAF9F6",
          color: "#3D2B1F",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#78716c", marginBottom: 24 }}>
            Wuf hit an unexpected error. Try again or head home.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => unstable_retry()}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                background: "#3D2B1F",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload to escape error state */}
            <a
              href="/"
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "1px solid #d6d3d1",
                background: "white",
                color: "#3D2B1F",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
