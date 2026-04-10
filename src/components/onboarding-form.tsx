"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/actions/onboarding";

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthday, setBirthday] = useState("");
  const [sex, setSex] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await completeOnboarding({
        name: name.trim(),
        breed: breed || undefined,
        birthday: birthday || undefined,
        sex: sex || undefined,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="wuf-btn w-full py-4 text-[15px] mt-4"
      >
        {isPending ? "Setting up..." : "Get started"}
      </button>
    </form>
  );
}
