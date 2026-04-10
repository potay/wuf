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

export function PuppyAvatar({ illustrationUrl, breed, puppyName, className = "w-24 h-24" }: PuppyAvatarProps) {
  const [state, dispatch] = useReducer(reducer, {
    url: illustrationUrl,
    loading: !illustrationUrl,
  });
  const attempted = useRef(false);

  useEffect(() => {
    if (state.url || attempted.current) return;
    attempted.current = true;

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
      .catch(() => dispatch({ type: "done" }));
  }, [state.url, breed]);

  if (state.loading) {
    return (
      <div className={`${className} rounded-2xl flex items-center justify-center bg-white/10 animate-pulse`}>
        <span className="text-2xl">🎨</span>
      </div>
    );
  }

  if (state.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={state.url} alt={puppyName} className={`${className} object-contain`} />
    );
  }

  return (
    <div className={`${className} rounded-2xl flex items-center justify-center bg-white/10`}>
      <span className="text-3xl">🐾</span>
    </div>
  );
}
