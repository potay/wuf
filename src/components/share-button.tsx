"use client";

import { useState } from "react";

interface ShareButtonProps {
  puppyName: string;
  inviteCode: string;
}

export function ShareButton({ puppyName, inviteCode }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${inviteCode}`;
  const shareText = `Check out ${puppyName}'s puppy journey on Wuf! 🐾`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${puppyName} on Wuf`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed - fall back to copy
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
      style={{
        background: copied ? "var(--ok)" : "rgba(255,255,255,0.15)",
        color: "white",
      }}
    >
      {copied ? "✓ Copied" : "📤 Share"}
    </button>
  );
}
