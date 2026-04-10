"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface IllustrationEditorProps {
  currentUrl: string | null;
  breed: string;
  puppyName: string;
}

const QUICK_CUSTOMIZATIONS = [
  "Make the eyes blue",
  "Make the eyes brown",
  "Add a merle/spotted pattern to the fur",
  "Make the fur more curly",
  "Make the fur lighter/cream colored",
  "Make the fur darker",
  "Add a white blaze on the face",
  "Make it a puppy (younger looking)",
  "Add floppy ears",
  "Make it fluffier",
];

export function IllustrationEditor({ currentUrl, breed, puppyName }: IllustrationEditorProps) {
  const router = useRouter();
  const [url, setUrl] = useState(currentUrl);
  const [generating, setGenerating] = useState(false);
  const [customization, setCustomization] = useState("");
  const [history, setHistory] = useState<string[]>(currentUrl ? [currentUrl] : []);

  async function handleGenerate(prompt?: string) {
    const desc = prompt || customization;
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          breed,
          customization: desc || undefined,
          currentImageUrl: url || undefined, // Pass current image for edits
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUrl(data.url);
        setHistory((prev) => [...prev, data.url]);
        setCustomization("");
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevert(targetUrl: string) {
    // Use PATCH to set illustration to an existing URL
    try {
      const res = await fetch("/api/generate-illustration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (res.ok) {
        setUrl(targetUrl);
        router.refresh();
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Current illustration */}
      <div className="wuf-card p-6 flex flex-col items-center">
        {generating ? (
          <div className="w-48 h-48 rounded-3xl flex flex-col items-center justify-center bg-[var(--bg)] animate-pulse">
            <span className="text-4xl mb-2">🎨</span>
            <span className="text-[13px] font-semibold text-[var(--fg-3)]">Generating...</span>
          </div>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={puppyName}
            className="w-48 h-48 object-contain"
          />
        ) : (
          <div className="w-48 h-48 rounded-3xl flex flex-col items-center justify-center bg-[var(--bg)]">
            <span className="text-4xl mb-2">🐾</span>
            <span className="text-[13px] text-[var(--fg-3)]">No illustration yet</span>
          </div>
        )}

        {!generating && (
          <button
            onClick={() => handleGenerate()}
            className="wuf-btn px-6 py-2.5 text-[13px] mt-4"
          >
            {url ? "Regenerate from scratch" : "Generate illustration"}
          </button>
        )}
      </div>

      {/* Quick customizations - these edit the current image */}
      {url && (
        <section>
          <h2 className="text-[15px] font-bold text-[var(--fg)] mb-3">Quick adjustments</h2>
          <p className="text-[12px] text-[var(--fg-3)] mb-2">
            These modify your current illustration
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_CUSTOMIZATIONS.map((desc) => (
              <button
                key={desc}
                onClick={() => handleGenerate(desc)}
                disabled={generating}
                className="wuf-chip wuf-chip-inactive text-[12px] disabled:opacity-40"
              >
                {desc}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Custom description */}
      {url && (
        <section>
          <h2 className="text-[15px] font-bold text-[var(--fg)] mb-3">Describe a change</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={customization}
              onChange={(e) => setCustomization(e.target.value)}
              placeholder={`e.g., "Make ${puppyName}'s ears pointier"`}
              disabled={generating}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && customization.trim()) {
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={generating || !customization.trim()}
              className="wuf-btn px-4 py-2 text-[13px] shrink-0"
            >
              Go
            </button>
          </div>
        </section>
      )}

      {/* History - click to revert */}
      {history.length > 1 && (
        <section>
          <h2 className="text-[15px] font-bold text-[var(--fg)] mb-2">Previous versions</h2>
          <p className="text-[12px] text-[var(--fg-3)] mb-3">
            Tap to revert to a previous version
          </p>
          <div className="grid grid-cols-4 gap-2">
            {history.map((histUrl, i) => (
              <button
                key={i}
                onClick={() => handleRevert(histUrl)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  url === histUrl ? "border-[var(--accent)] shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={histUrl} alt={`Version ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
