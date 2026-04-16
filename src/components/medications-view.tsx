"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Medication } from "@/db/schema";
import { addMedication, toggleMedicationActive, deleteMedication } from "@/actions/medications";
import { formatDate } from "@/lib/utils";

interface MedicationsViewProps {
  medications: Medication[];
  canWrite?: boolean;
}

export function MedicationsView({ medications, canWrite = true }: MedicationsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  const active = medications.filter((m) => m.active);
  const inactive = medications.filter((m) => !m.active);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !frequency.trim()) return;

    startTransition(async () => {
      await addMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        startDate: new Date(),
        notes: notes || undefined,
      });
      setName("");
      setDosage("");
      setFrequency("");
      setNotes("");
      setIsAdding(false);
      router.refresh();
    });
  }

  function handleToggle(med: Medication) {
    startTransition(async () => {
      await toggleMedicationActive(med.id, !med.active);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this medication?")) return;
    startTransition(async () => {
      await deleteMedication(id);
      router.refresh();
    });
  }

  function MedCard({ med }: { med: Medication }) {
    return (
      <div className={`bg-white rounded-xl border p-4 ${med.active ? "border-stone-100" : "border-stone-100 opacity-60"}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${med.active ? "bg-green-400" : "bg-stone-300"}`} />
              <h3 className="text-sm font-semibold text-stone-800">{med.name}</h3>
            </div>
            <div className="text-xs text-stone-500 mt-1 ml-4 space-y-0.5">
              <div><span className="font-medium">Dosage:</span> {med.dosage}</div>
              <div><span className="font-medium">Frequency:</span> {med.frequency}</div>
              <div><span className="font-medium">Started:</span> {formatDate(med.startDate)}</div>
              {med.notes && <div className="text-stone-400 italic">{med.notes}</div>}
            </div>
          </div>
          {canWrite && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggle(med)}
                disabled={isPending}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                  med.active
                    ? "bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-500"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {med.active ? "Stop" : "Resume"}
              </button>
              <button
                onClick={() => handleDelete(med.id)}
                disabled={isPending}
                className="text-stone-300 hover:text-red-400 p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active */}
      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Active ({active.length})
          </h2>
          <div className="space-y-2">
            {active.map((m) => <MedCard key={m.id} med={m} />)}
          </div>
        </section>
      )}

      {/* Inactive */}
      {inactive.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Stopped ({inactive.length})
          </h2>
          <div className="space-y-2">
            {inactive.map((m) => <MedCard key={m.id} med={m} />)}
          </div>
        </section>
      )}

      {medications.length === 0 && !isAdding && (
        <div className="text-center py-8 text-stone-400">
          <div className="text-3xl mb-2">💊</div>
          <p className="text-sm">No medications tracked yet</p>
        </div>
      )}

      {/* Add medication */}
      {canWrite && (isAdding ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Medication name"
            required
            className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Dosage (e.g., 50mg)"
              required
              className="flex-1 p-2.5 rounded-lg border border-stone-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
            />
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Frequency (e.g., 2x daily)"
              required
              className="flex-1 p-2.5 rounded-lg border border-stone-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
            />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add medication"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
            hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
        >
          + Add medication
        </button>
      ))}
    </div>
  );
}
