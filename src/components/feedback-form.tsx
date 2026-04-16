"use client";

import { useState } from "react";

const RATINGS = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🐾", label: "Love it" },
];

export function FeedbackForm() {
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!rating && !text.trim()) return;
    setSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text: text.trim(), source: "form" }),
    });
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="wuf-card p-8 text-center space-y-3">
        <div className="text-4xl">🐾</div>
        <h2 className="text-[17px] font-bold" style={{ color: "var(--fg)" }}>Thanks for your feedback!</h2>
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          We read every response and use it to make Wuf better.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating */}
      <div className="wuf-card p-5 space-y-4">
        <h2 className="text-[15px] font-bold" style={{ color: "var(--fg)" }}>
          How&apos;s Wuf working for you?
        </h2>
        <div className="flex justify-between">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRating(r.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                rating === r.value ? "scale-110" : "opacity-50 hover:opacity-80"
              }`}
            >
              <span className="text-3xl">{r.emoji}</span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--fg-3)" }}>
                {r.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Text feedback */}
      <div className="wuf-card p-5 space-y-3">
        <h2 className="text-[15px] font-bold" style={{ color: "var(--fg)" }}>
          Anything else?
        </h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's working well? What could be better? Feature requests?"
          rows={4}
          className="w-full"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || (!rating && !text.trim())}
        className="wuf-btn w-full py-4 text-[15px]"
      >
        {submitting ? "Sending..." : "Send feedback"}
      </button>
    </div>
  );
}
