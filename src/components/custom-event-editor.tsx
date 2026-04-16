"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface CustomEventEditorProps {
  onClose: () => void;
}

const EMOJI_OPTIONS = [
  "🛁", "🧹", "✂️", "🎾", "🦷", "🧸", "🩺", "🐾", "🎒", "🚗",
  "📸", "🎵", "🏊", "🧴", "🪥", "💅", "🧊", "🌡️", "🎀", "🍎",
];

const COLOR_OPTIONS = [
  "#FEE2E2", "#FECACA", "#FED7AA", "#FEF9C3", "#D9F99D",
  "#BBF7D0", "#A7F3D0", "#BAE6FD", "#DDD6FE", "#FBCFE8",
  "#E0E7FF", "#F3E8FF", "#FCE7F3", "#CCFBF1", "#F1F5F9",
];

export function CustomEventEditor({ onClose }: CustomEventEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🛁");
  const [color, setColor] = useState("#BAE6FD");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    const id = name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    startTransition(async () => {
      try {
        const res = await fetch("/api/custom-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, label: name.trim(), emoji, bg: color }),
        });
        if (!res.ok) throw new Error("Failed to save custom event");
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 safe-bottom space-y-4"
        style={{ boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: "var(--fg)" }}>
            Add custom event
          </h2>
          <button onClick={onClose} className="text-[var(--fg-3)] text-sm p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
              Event name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bathe, Groom, Vet call"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    emoji === e ? "ring-2 ring-[var(--accent)] scale-110" : "bg-stone-50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c ? "ring-2 ring-[var(--accent)] scale-110" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 py-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: color }}
            >
              {emoji}
            </div>
            <span className="text-[13px] font-bold text-[var(--fg)]">
              {name || "Preview"}
            </span>
          </div>

          {error && (
            <div
              className="text-[13px] font-medium px-4 py-2 rounded-xl text-center"
              style={{ background: "#FEE2E2", color: "#991B1B" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="wuf-btn w-full py-3 text-[14px]"
          >
            {isPending ? "Adding..." : "Add event type"}
          </button>
        </form>
      </div>
    </div>
  );
}
