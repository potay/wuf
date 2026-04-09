"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type MedicalRecord,
  type MedicalRecordCategory,
  type MedicalRecordFile,
  MEDICAL_RECORD_CATEGORIES,
} from "@/db/schema";
import { createMedicalRecord, deleteMedicalRecord } from "@/actions/medical-records";
import { createReminder } from "@/actions/reminders";
import { formatDate } from "@/lib/utils";
import type { ReminderCategory } from "@/lib/reminder-categories";

interface ParsedRecord {
  type?: string;
  title?: string;
  date?: string;
  category?: MedicalRecordCategory;
  vet?: { name?: string; phone?: string; provider?: string };
  line_items?: { description: string; cost: number; notes?: string }[];
  total_cost?: number;
  vaccinations?: { name: string; date: string; notes?: string }[];
  medications?: { name: string; dosage: string; frequency: string; notes?: string }[];
  reminders?: { title: string; due_description: string; due_date?: string | null }[];
  insurance?: {
    provider?: string;
    policy_number?: string;
    start_date?: string;
    end_date?: string;
    premium?: string;
    deductible?: string;
    annual_limit?: string;
    coverage_percentage?: string;
  };
  notes?: string;
}

interface MedicalRecordsViewProps {
  records: MedicalRecord[];
}

export function MedicalRecordsView({ records }: MedicalRecordsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "smart" | "manual">("idle");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MedicalRecordCategory>("vet_visit");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<MedicalRecordFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSmartUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    setParsing(true);

    // Upload the file first
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
    let uploadedFile: MedicalRecordFile | null = null;
    if (uploadRes.ok) {
      uploadedFile = await uploadRes.json();
    }

    // Parse the file with AI
    const parseForm = new FormData();
    parseForm.append("file", file);
    const parseRes = await fetch("/api/parse-record", { method: "POST", body: parseForm });

    if (parseRes.ok) {
      const data: ParsedRecord = await parseRes.json();
      setParsed(data);
      // Auto-fill form
      if (data.title) setTitle(data.title);
      if (data.date) setDate(data.date);
      if (data.category) setCategory(data.category);
      // Build notes from parsed data
      const notesParts: string[] = [];
      if (data.vet?.name) notesParts.push(`Vet: ${data.vet.name}`);
      if (data.vet?.provider) notesParts.push(`Provider: ${data.vet.provider}`);
      if (data.total_cost) notesParts.push(`Total: $${data.total_cost.toFixed(2)}`);
      if (data.line_items?.length) {
        notesParts.push("\nServices:");
        data.line_items.forEach((item) => {
          notesParts.push(`- ${item.description}${item.cost ? ` ($${item.cost.toFixed(2)})` : ""}`);
          if (item.notes) notesParts.push(`  ${item.notes}`);
        });
      }
      if (data.vaccinations?.length) {
        notesParts.push("\nVaccinations:");
        data.vaccinations.forEach((v) => {
          notesParts.push(`- ${v.name}${v.notes ? ` (${v.notes})` : ""}`);
        });
      }
      if (data.medications?.length) {
        notesParts.push("\nMedications:");
        data.medications.forEach((m) => {
          notesParts.push(`- ${m.name} ${m.dosage}, ${m.frequency}`);
        });
      }
      if (data.insurance) {
        const ins = data.insurance;
        notesParts.push(`\nInsurance: ${ins.provider || ""}`);
        if (ins.policy_number) notesParts.push(`Policy: ${ins.policy_number}`);
        if (ins.coverage_percentage) notesParts.push(`Coverage: ${ins.coverage_percentage}`);
        if (ins.deductible) notesParts.push(`Deductible: ${ins.deductible}`);
        if (ins.annual_limit) notesParts.push(`Annual limit: ${ins.annual_limit}`);
        if (ins.premium) notesParts.push(`Premium: ${ins.premium}`);
      }
      if (data.notes) notesParts.push(`\n${data.notes}`);
      setNotes(notesParts.join("\n"));
    }

    if (uploadedFile) {
      setFiles([uploadedFile]);
    }

    setParsing(false);
    setMode("smart");
    e.target.value = "";
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    setUploading(true);
    const uploaded: MedicalRecordFile[] = [];

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        uploaded.push(data);
      }
    }

    setFiles((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createMedicalRecord({
        title: title.trim(),
        category,
        date: new Date(date + "T12:00:00"),
        notes: notes || undefined,
        files,
      });

      // Auto-create reminders from parsed data
      if (parsed?.reminders) {
        for (const reminder of parsed.reminders) {
          if (reminder.due_date) {
            await createReminder({
              title: reminder.title,
              category: "vet" as ReminderCategory,
              dueAt: new Date(reminder.due_date + "T09:00:00"),
              notes: reminder.due_description,
            });
          }
        }
      }

      resetForm();
      router.refresh();
    });
  }

  function resetForm() {
    setTitle("");
    setNotes("");
    setFiles([]);
    setCategory("vet_visit");
    setDate(new Date().toISOString().split("T")[0]);
    setParsed(null);
    setMode("idle");
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => {
      await deleteMedicalRecord(id);
      router.refresh();
    });
  }

  // Group by category
  const grouped = new Map<MedicalRecordCategory, MedicalRecord[]>();
  for (const record of records) {
    const existing = grouped.get(record.category) || [];
    existing.push(record);
    grouped.set(record.category, existing);
  }

  const isFormOpen = mode === "smart" || mode === "manual";

  return (
    <div className="space-y-6">
      {/* Add record buttons */}
      {!isFormOpen && !parsing && (
        <div className="space-y-2">
          <label
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-amber-500 text-white
              font-semibold text-sm cursor-pointer hover:bg-amber-600 active:scale-[0.98] transition-all"
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp"
              onChange={handleSmartUpload}
              className="hidden"
            />
            <span className="text-lg">🤖</span>
            Smart upload (auto-parse PDF)
          </label>
          <button
            onClick={() => setMode("manual")}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
              hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
          >
            + Add manually
          </button>
        </div>
      )}

      {/* Parsing indicator */}
      {parsing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2 animate-pulse">🤖</div>
          <div className="text-sm font-medium text-amber-800">Parsing document...</div>
          <div className="text-xs text-amber-600 mt-1">Extracting vet info, vaccines, meds, and reminders</div>
        </div>
      )}

      {/* Form (for both smart and manual mode) */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
          {parsed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
              <span className="font-semibold">Auto-filled from document.</span> Review and edit below, then save.
              {parsed.reminders && parsed.reminders.length > 0 && (
                <span className="block mt-1">
                  {parsed.reminders.length} reminder{parsed.reminders.length > 1 ? "s" : ""} will be auto-created.
                </span>
              )}
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Record title (e.g., Annual checkup)"
            required
            className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
          />

          <div className="flex gap-2 flex-wrap">
            {(Object.entries(MEDICAL_RECORD_CATEGORIES) as [MedicalRecordCategory, { label: string; emoji: string }][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === key
                      ? "bg-amber-500 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {config.emoji} {config.label}
                </button>
              )
            )}
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={notes.split("\n").length > 5 ? Math.min(notes.split("\n").length + 1, 15) : 3}
            className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300 resize-none"
          />

          {/* File upload for manual mode or additional files */}
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
              {files.length > 0 ? "Attached files" : "Attach files"}
            </label>

            {files.length > 0 && (
              <div className="mb-2 space-y-1">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg text-xs"
                  >
                    <span>{file.contentType.includes("pdf") ? "📄" : "🖼️"}</span>
                    <span className="flex-1 truncate text-stone-600">{file.name}</span>
                    <span className="text-stone-400">{(file.size / 1024).toFixed(0)}KB</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-stone-400 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed
                cursor-pointer transition-colors text-xs ${
                  uploading
                    ? "border-amber-300 bg-amber-50 text-amber-500"
                    : "border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-500"
                }`}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? "Uploading..." : "📎 Add more files"}
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || uploading}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save record"}
            </button>
          </div>
        </form>
      )}

      {/* Records list */}
      {records.length === 0 && mode === "idle" && (
        <div className="text-center py-8 text-stone-400">
          <div className="text-3xl mb-2">🗂️</div>
          <p className="text-sm">No medical records yet</p>
          <p className="text-xs mt-1">Upload a PDF from your vet and we&apos;ll extract the details</p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([cat, catRecords]) => {
        const catConfig = MEDICAL_RECORD_CATEGORIES[cat];
        return (
          <section key={cat}>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
              {catConfig.emoji} {catConfig.label} ({catRecords.length})
            </h2>
            <div className="space-y-2">
              {catRecords.map((record) => {
                const isExpanded = expandedId === record.id;
                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-xl border border-stone-100 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg">
                        {catConfig.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-800 truncate">
                          {record.title}
                        </div>
                        <div className="text-xs text-stone-400">
                          {formatDate(record.date)}
                          {record.files.length > 0 && (
                            <span className="ml-2">📎 {record.files.length} file{record.files.length > 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-stone-300 text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-stone-50 pt-2">
                        {record.notes && (
                          <pre className="text-xs text-stone-500 whitespace-pre-wrap font-sans">
                            {record.notes}
                          </pre>
                        )}

                        {record.files.length > 0 && (
                          <div className="space-y-1">
                            {record.files.map((file, i) => (
                              <a
                                key={i}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg text-xs
                                  hover:bg-amber-50 transition-colors"
                              >
                                <span>{file.contentType.includes("pdf") ? "📄" : "🖼️"}</span>
                                <span className="flex-1 truncate text-stone-600">{file.name}</span>
                                <span className="text-amber-500 font-medium shrink-0">View</span>
                              </a>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={isPending}
                          className="text-xs text-red-400 hover:text-red-500 disabled:opacity-50"
                        >
                          Delete record
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
