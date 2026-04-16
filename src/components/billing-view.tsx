"use client";

import { useState } from "react";

interface BillingViewProps {
  canWrite: boolean;
  subscriptionStatus: string;
  trialDaysLeft: number;
  trialEndsAtFormatted: string;
  isOwner: boolean;
  puppyName: string;
}

export function BillingView({ canWrite, subscriptionStatus, trialDaysLeft, trialEndsAtFormatted, isOwner, puppyName }: BillingViewProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const daysLeft = trialDaysLeft;
  const isTrialing = subscriptionStatus === "trialing" && canWrite;
  const isActive = subscriptionStatus === "active";
  const isExpired = !canWrite && !isActive;

  async function handleCheckout() {
    setLoading("checkout");
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(null);
  }

  async function handlePortal() {
    setLoading("portal");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(null);
  }

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="wuf-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-3)" }}>
              Current plan
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--fg)" }}>
              {isActive ? "Wuf Pro" : "Free trial"}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[12px] font-bold ${
            isActive ? "bg-green-100 text-green-700"
            : isTrialing ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-700"
          }`}>
            {isActive ? "Active" : isTrialing ? `${daysLeft} days left` : "Expired"}
          </div>
        </div>

        {isTrialing && (
          <div>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span style={{ color: "var(--fg-3)" }}>Trial ends</span>
              <span className="font-semibold" style={{ color: "var(--fg)" }}>
                {trialEndsAtFormatted}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, 100 - (daysLeft / 14) * 100)}%`,
                  background: daysLeft <= 3 ? "var(--urgent)" : "var(--accent)",
                }}
              />
            </div>
          </div>
        )}

        {isActive && (
          <div className="text-[13px]" style={{ color: "var(--fg-2)" }}>
            $3/month for {puppyName}. All features unlocked for all members.
          </div>
        )}

        {isExpired && (
          <div className="text-[13px]" style={{ color: "var(--fg-2)" }}>
            Your trial has ended. The app is in read-only mode.
            Subscribe to continue logging events and tracking {puppyName}&apos;s progress.
          </div>
        )}
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="space-y-3">
          {!isActive && (
            <button
              onClick={handleCheckout}
              disabled={loading !== null}
              className="wuf-btn w-full py-4 text-[15px]"
            >
              {loading === "checkout" ? "Redirecting to Stripe..." : "Subscribe — $3/month"}
            </button>
          )}

          {isActive && (
            <button
              onClick={handlePortal}
              disabled={loading !== null}
              className="w-full py-4 rounded-2xl text-[15px] font-bold transition-colors"
              style={{ background: "var(--bg)", color: "var(--fg-2)" }}
            >
              {loading === "portal" ? "Opening..." : "Manage billing"}
            </button>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="text-center text-[13px] p-4 rounded-2xl" style={{ background: "var(--bg)", color: "var(--fg-3)" }}>
          Only the puppy owner can manage billing.
        </div>
      )}

      {/* Pricing details */}
      <div className="wuf-card p-5 space-y-3">
        <h2 className="text-[15px] font-bold" style={{ color: "var(--fg)" }}>
          What&apos;s included
        </h2>
        <ul className="space-y-2 text-[13px]" style={{ color: "var(--fg-2)" }}>
          {[
            "Unlimited event logging (pee, poop, meals, walks...)",
            "Crate training timer with push notifications",
            "Smart insights and potty pattern analysis",
            "Weight tracking with growth projection",
            "Training tracker and socialization checklist",
            "Medical records with AI document parsing",
            "Custom AI-generated puppy illustration",
            "Multi-user access via invite codes",
            "Shareable public puppy profile",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
