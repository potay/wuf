"use client";

import { useEffect, useReducer, useState } from "react";

const MOODS = [
  { value: 1, emoji: "😞" },
  { value: 3, emoji: "😐" },
  { value: 5, emoji: "😊" },
];

function shouldShow(): boolean {
  if (typeof window === "undefined") return false;
  const dismissed = localStorage.getItem("satisfaction-prompt");
  if (dismissed) return false;
  const firstVisit = localStorage.getItem("first-visit");
  if (!firstVisit) {
    localStorage.setItem("first-visit", String(Date.now()));
    return false;
  }
  const daysSinceFirst = (Date.now() - parseInt(firstVisit, 10)) / (24 * 60 * 60 * 1000);
  return daysSinceFirst >= 7;
}

export function SatisfactionPrompt() {
  const [visible, toggle] = useReducer((_: boolean, action: boolean) => action, false);
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (shouldShow()) toggle(true);
  }, []);

  function handleDismiss() {
    toggle(false);
    localStorage.setItem("satisfaction-prompt", "dismissed");
  }

  async function handleSubmit() {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: selected, text: text.trim(), source: "satisfaction" }),
    });
    setSubmitted(true);
    localStorage.setItem("satisfaction-prompt", "submitted");
    setTimeout(() => toggle(false), 2000);
  }

  if (!visible) return null;

  if (submitted) {
    return (
      <div className="wuf-card p-4 text-center">
        <span className="text-[14px] font-bold" style={{ color: "var(--ok)" }}>
          Thanks! 🐾
        </span>
      </div>
    );
  }

  return (
    <div className="wuf-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <span className="text-[14px] font-bold" style={{ color: "var(--fg)" }}>
          How&apos;s Wuf working for you?
        </span>
        <button onClick={handleDismiss} className="text-[var(--fg-3)] text-xs p-1">✕</button>
      </div>

      <div className="flex justify-center gap-6">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelected(m.value)}
            className={`text-3xl transition-all ${
              selected === m.value ? "scale-125" : "opacity-40 hover:opacity-70"
            }`}
          >
            {m.emoji}
          </button>
        ))}
      </div>

      {selected !== null && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us more (optional)"
            rows={2}
            className="w-full text-[13px]"
          />
          <button
            onClick={handleSubmit}
            className="wuf-btn w-full py-2.5 text-[13px]"
          >
            Send
          </button>
        </>
      )}
    </div>
  );
}
