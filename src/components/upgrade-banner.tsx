"use client";

import { useState } from "react";

interface UpgradeBannerProps {
  canWrite: boolean;
  subscriptionStatus: string;
  trialDaysLeft: number;
  isOwner: boolean;
}

export function UpgradeBanner({ canWrite, subscriptionStatus, trialDaysLeft, isOwner }: UpgradeBannerProps) {
  const [loading, setLoading] = useState(false);

  if (subscriptionStatus === "active") return null;

  const isTrialing = subscriptionStatus === "trialing" && canWrite;
  const isExpired = !canWrite;

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  if (isExpired) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--urgent-bg)", border: "1px solid #fca5a5" }}>
        <div className="flex-1">
          <div className="text-[14px] font-bold" style={{ color: "var(--urgent)" }}>
            Free trial ended
          </div>
          <div className="text-[12px] text-stone-500 mt-0.5">
            {isOwner
              ? "Subscribe to continue logging events and tracking progress."
              : "Ask the puppy owner to subscribe to continue."}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="wuf-btn px-4 py-2 text-[13px] shrink-0"
          >
            {loading ? "..." : "$3/mo"}
          </button>
        )}
      </div>
    );
  }

  if (isTrialing && trialDaysLeft <= 5) {
    return (
      <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: "var(--warn-bg)", border: "1px solid #fde68a" }}>
        <div className="flex-1">
          <div className="text-[13px] font-bold" style={{ color: "var(--warn)" }}>
            {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in free trial
          </div>
          <div className="text-[11px] text-stone-500">
            Subscribe to keep all features after the trial.
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="wuf-btn px-3 py-1.5 text-[12px] shrink-0"
          >
            {loading ? "..." : "$3/mo"}
          </button>
        )}
      </div>
    );
  }

  return null;
}
