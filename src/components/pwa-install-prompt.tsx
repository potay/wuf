"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (navigator as unknown as { standalone: boolean }).standalone)
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) return;

    // Don't show if user dismissed before (check localStorage)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Show after a short delay so it doesn't overwhelm on first load
    const timer = setTimeout(() => setShow(true), 3000);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  function handleDismiss() {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  }

  async function handleInstall() {
    if (deferredPrompt) {
      // Android/Chrome native install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS()) {
      setShowIOSGuide(true);
    }
  }

  if (!show) return null;

  return (
    <>
      {/* Install banner */}
      {!showIOSGuide && (
        <div className="wuf-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "var(--accent-light)" }}>
            📲
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-[var(--fg)]">
              Add Wuf to your home screen
            </div>
            <div className="text-[11px] text-[var(--fg-3)]">
              Quick access, push notifications, works offline
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="wuf-btn px-3 py-1.5 text-[12px]"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-[var(--fg-3)] text-xs p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* iOS install guide */}
      {showIOSGuide && (
        <div className="wuf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[var(--fg)]">
              Add to Home Screen
            </h3>
            <button
              onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
              className="text-[var(--fg-3)] text-xs p-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                1
              </div>
              <div className="text-[13px] text-[var(--fg-2)]">
                Tap the <strong>Share</strong> button
                <span className="inline-block ml-1 text-[16px] align-middle">
                  ⬆️
                </span>
                {" "}at the bottom of Safari
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                2
              </div>
              <div className="text-[13px] text-[var(--fg-2)]">
                Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                3
              </div>
              <div className="text-[13px] text-[var(--fg-2)]">
                Tap <strong>&quot;Add&quot;</strong> — Wuf will appear on your home screen like a real app!
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
