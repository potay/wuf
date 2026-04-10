"use client";

import { useState, useTransition } from "react";
import { completeOnboarding, joinPuppy } from "@/actions/onboarding";

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthday, setBirthday] = useState("");
  const [sex, setSex] = useState("");

  // Join form state
  const [inviteCode, setInviteCode] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({
          name: name.trim(),
          breed: breed || undefined,
          birthday: birthday || undefined,
          sex: sex || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await joinPuppy(inviteCode.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid invite code");
      }
    });
  }

  if (mode === "choose") {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setMode("create")}
          className="wuf-btn w-full py-4 text-[15px]"
        >
          Add a new puppy
        </button>
        <button
          onClick={() => setMode("join")}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-[var(--fg-2)]"
          style={{ background: "var(--bg)" }}
        >
          Join with invite code
        </button>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
            Invite code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="e.g., ABC123"
            required
            maxLength={6}
            className="w-full text-center text-[24px] font-bold tracking-[0.3em] uppercase"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || inviteCode.length < 6}
          className="wuf-btn w-full py-4 text-[15px]"
        >
          {isPending ? "Joining..." : "Join puppy"}
        </button>
        <button
          type="button"
          onClick={() => { setMode("choose"); setError(null); }}
          className="w-full py-2 text-[13px] font-semibold text-[var(--fg-3)]"
        >
          Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div>
        <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
          Puppy&apos;s name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Buddy, Luna, Toro"
          required
          className="w-full"
        />
      </div>

      <div>
        <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
          Breed
        </label>
        <input
          type="text"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="e.g., Aussiedoodle, Golden Retriever"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
            Birthday
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-1.5 block">
            Sex
          </label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full"
          >
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="wuf-btn w-full py-4 text-[15px]"
      >
        {isPending ? "Setting up..." : "Get started"}
      </button>
      <button
        type="button"
        onClick={() => { setMode("choose"); setError(null); }}
        className="w-full py-2 text-[13px] font-semibold text-[var(--fg-3)]"
      >
        Back
      </button>
    </form>
  );
}
