"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type PuppyProfile } from "@/db/schema";
import { updateProfile } from "@/actions/profile";

interface ProfileFormProps {
  profile: PuppyProfile;
}

interface FieldConfig {
  key: keyof PuppyProfile;
  label: string;
  placeholder: string;
  type?: string;
}

const SECTIONS: { title: string; emoji: string; fields: FieldConfig[] }[] = [
  {
    title: "Basic info",
    emoji: "🐾",
    fields: [
      { key: "name", label: "Name", placeholder: "Toro" },
      { key: "breed", label: "Breed", placeholder: "e.g., Golden Retriever" },
      { key: "birthday", label: "Birthday", placeholder: "", type: "date" },
      { key: "sex", label: "Sex", placeholder: "e.g., Female" },
      { key: "color", label: "Color", placeholder: "e.g., Golden" },
      { key: "microchipId", label: "Microchip ID", placeholder: "e.g., 985112345678901" },
    ],
  },
  {
    title: "Vet",
    emoji: "🏥",
    fields: [
      { key: "vetName", label: "Vet name", placeholder: "e.g., Dr. Smith" },
      { key: "vetPhone", label: "Vet phone", placeholder: "e.g., (555) 123-4567", type: "tel" },
    ],
  },
  {
    title: "Emergency vet",
    emoji: "🚨",
    fields: [
      { key: "emergencyVetName", label: "Emergency vet", placeholder: "e.g., Animal ER" },
      { key: "emergencyVetPhone", label: "Emergency phone", placeholder: "e.g., (555) 987-6543", type: "tel" },
    ],
  },
  {
    title: "Insurance",
    emoji: "📋",
    fields: [
      { key: "insuranceProvider", label: "Provider", placeholder: "e.g., Trupanion" },
      { key: "insurancePolicyNumber", label: "Policy number", placeholder: "e.g., POL-123456" },
    ],
  },
];

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const section of SECTIONS) {
      for (const field of section.fields) {
        initial[field.key] = (profile[field.key] as string) || "";
      }
    }
    initial.notes = profile.notes || "";
    return initial;
  });
  const [saved, setSaved] = useState(false);

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await updateProfile(form as Partial<PuppyProfile>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <section key={section.title} className="bg-white rounded-xl border border-stone-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
            {section.emoji} {section.title}
          </h2>
          {section.fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs text-stone-500 mb-1 block">{field.label}</label>
              <input
                type={field.type || "text"}
                value={form[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
              />
            </div>
          ))}
        </section>
      ))}

      {/* Notes */}
      <section className="bg-white rounded-xl border border-stone-100 p-4">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">
          📝 Notes
        </h2>
        <textarea
          value={form.notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Allergies, special needs, favorite treats..."
          rows={3}
          className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300 resize-none"
        />
      </section>

      <button
        onClick={handleSave}
        disabled={isPending}
        className={`w-full py-4 rounded-2xl text-white font-semibold text-base transition-all
          active:scale-[0.98] disabled:opacity-50
          ${saved ? "bg-green-500" : "bg-amber-500 hover:bg-amber-600"}`}
      >
        {saved ? "Saved! ✓" : isPending ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}
