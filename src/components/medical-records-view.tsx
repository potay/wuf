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
import { formatDate } from "@/lib/utils";

interface MedicalRecordsViewProps {
  records: MedicalRecord[];
}

export function MedicalRecordsView({ records }: MedicalRecordsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MedicalRecordCategory>("vet_visit");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<MedicalRecordFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      setTitle("");
      setNotes("");
      setFiles([]);
      setCategory("vet_visit");
      setIsAdding(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => {
      await deleteMedicalRecord(id);
      router.refresh();
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Group by category
  const grouped = new Map<MedicalRecordCategory, MedicalRecord[]>();
  for (const record of records) {
    const existing = grouped.get(record.category) || [];
    existing.push(record);
    grouped.set(record.category, existing);
  }

  return (
    <div className="space-y-6">
      {/* Add record */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
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
            rows={2}
            className="w-full p-2.5 rounded-lg border border-stone-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300 resize-none"
          />

          {/* File upload */}
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">
              Attach files
            </label>
            <label
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed
                cursor-pointer transition-colors ${
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
              {uploading ? (
                <span className="text-sm">Uploading...</span>
              ) : (
                <>
                  <span className="text-lg">📎</span>
                  <span className="text-sm">PDF, photo, or camera</span>
                </>
              )}
            </label>

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
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
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setFiles([]); }}
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
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400
            hover:border-amber-300 hover:text-amber-500 transition-colors text-sm font-medium"
        >
          + Add medical record
        </button>
      )}

      {/* Records list */}
      {records.length === 0 && !isAdding && (
        <div className="text-center py-8 text-stone-400">
          <div className="text-3xl mb-2">🗂️</div>
          <p className="text-sm">No medical records yet</p>
          <p className="text-xs mt-1">Upload PDFs and photos from the vet</p>
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
                          <p className="text-xs text-stone-500">{record.notes}</p>
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
                                <span className="text-amber-500 font-medium shrink-0">View →</span>
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
