"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

function getPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

function subscribeToPermission(callback: () => void) {
  const interval = setInterval(callback, 5000);
  return () => clearInterval(interval);
}

async function registerAndSubscribe() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  // Send subscription to server
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const permission = useSyncExternalStore(
    subscribeToPermission,
    getPermission,
    () => "default" as NotificationPermission
  );

  const registered = useRef(false);

  useEffect(() => {
    if (permission === "granted" && !registered.current) {
      registered.current = true;
      registerAndSubscribe().catch(console.error);
    }
  }, [permission]);

  const handleEnable = useCallback(async () => {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      await registerAndSubscribe();
    }
  }, []);

  if (permission !== "default") {
    return <>{children}</>;
  }

  return (
    <>
      <div className="wuf-card px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[var(--fg)]">Enable notifications</div>
          <div className="text-[11px] text-[var(--fg-3)]">Crate reminders and schedule alerts</div>
        </div>
        <button onClick={handleEnable} className="wuf-btn px-4 py-2 text-[12px] shrink-0">
          Enable
        </button>
      </div>
      {children}
    </>
  );
}

/** Fallback for when tab is open - uses basic Notification API */
export function sendNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icon-192.png", tag: title });
}
