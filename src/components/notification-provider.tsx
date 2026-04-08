"use client";

import { useCallback, useSyncExternalStore } from "react";

function getPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

function subscribeToPermission(callback: () => void) {
  // No native event for permission changes, but we poll rarely
  // The main update happens after the user clicks "Enable"
  const interval = setInterval(callback, 5000);
  return () => clearInterval(interval);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const permission = useSyncExternalStore(
    subscribeToPermission,
    getPermission,
    () => "default" as NotificationPermission
  );

  const handleEnable = useCallback(async () => {
    await Notification.requestPermission();
    // Permission state is read reactively via useSyncExternalStore
  }, []);

  if (permission !== "default") {
    return <>{children}</>;
  }

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-amber-800">
            Enable notifications?
          </div>
          <div className="text-xs text-amber-600">
            Get alerts for crate time, schedule reminders, and more
          </div>
        </div>
        <button
          onClick={handleEnable}
          className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold
            hover:bg-amber-600 transition-colors shrink-0"
        >
          Enable
        </button>
      </div>
      {children}
    </>
  );
}

export function sendNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/icon-192.png",
    tag: title,
  });
}
