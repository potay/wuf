"use client";

import { useEffect, useReducer, useRef } from "react";

interface PuppyAvatarProps {
  illustrationUrl: string | null;
  breed: string;
  puppyName: string;
  className?: string;
}

type State = { url: string | null; loading: boolean };
type Action = { type: "loaded"; url: string } | { type: "done" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loaded": return { url: action.url, loading: false };
    case "done": return { ...state, loading: false };
  }
}

// Module-level flag to prevent duplicate generation across re-mounts
let generationInProgress = false;

export function PuppyAvatar({ illustrationUrl, breed, puppyName, className = "w-24 h-24" }: PuppyAvatarProps) {
  const [state, dispatch] = useReducer(reducer, {
    url: illustrationUrl,
    loading: false,
  });
  const attempted = useRef(false);

  useEffect(() => {
    // Don't auto-generate - only show what exists or fallback
    // Generation should only happen from the /illustration page
    if (illustrationUrl && !state.url) {
      dispatch({ type: "loaded", url: illustrationUrl });
    }
  }, [illustrationUrl, state.url]);

  // Only auto-generate once, ever, and only if no illustration exists
  useEffect(() => {
    if (state.url || attempted.current || generationInProgress) return;
    attempted.current = true;
    generationInProgress = true;

    fetch("/api/generate-illustration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ breed }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.url) dispatch({ type: "loaded", url: data.url });
        else dispatch({ type: "done" });
      })
      .catch(() => dispatch({ type: "done" }))
      .finally(() => { generationInProgress = false; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={state.url} alt={puppyName} className={`${className} object-contain`} />
    );
  }

  // Fallback - paw emoji (no loading spinner to avoid confusion)
  return (
    <div className={`${className} rounded-2xl flex items-center justify-center bg-white/10`}>
      <span className="text-3xl">🐾</span>
    </div>
  );
}
