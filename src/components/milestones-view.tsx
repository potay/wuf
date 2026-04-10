"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Milestone, type MilestoneMedia } from "@/db/schema";
import { createMilestone, deleteMilestone } from "@/actions/milestones";
import { formatDateTime } from "@/lib/utils";

interface MilestonesViewProps {
  milestones: Milestone[];
}

export function MilestonesView({ milestones }: MilestonesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [media, setMedia] = useState<MilestoneMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    setUploading(true);
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setMedia((prev) => [...prev, { url: data.url, contentType: data.contentType, name: data.name }]);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createMilestone({
        title: title.trim(),
        notes: notes || undefined,
        media: media.length > 0 ? media : undefined,
      });
      setTitle("");
      setNotes("");
      setMedia([]);
      setIsAdding(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this milestone?")) return;
    startTransition(async () => {
      await deleteMilestone(id);
      router.refresh();
    });
  }

  function isVideo(contentType: string) {
    return contentType.startsWith("video/");
  }

  return (
    <div className="space-y-4">
      {/* Add milestone */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="wuf-card p-5 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What happened? e.g., First walk outside"
            required
            className="w-full"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details (optional)"
            rows={2}
            className="w-full"
          />

          {/* Media upload */}
          <div>
            {media.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {media.map((m, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-[var(--bg)]">
                    {isVideo(m.contentType) ? (
                      <video src={m.url} className="w-full h-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => document.getElementById("milestone-file-input")?.click()}
              disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed
                transition-colors text-[13px] font-semibold ${
                  uploading
                    ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--fg-3)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
            >
              {uploading ? "Uploading..." : "📷 Add photos or videos"}
            </button>
            <input
              id="milestone-file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.heic,.heif,.webp,.mp4,.mov,.webm"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setMedia([]); }}
              className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-[var(--fg-3)]"
              style={{ background: "var(--bg)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || uploading}
              className="wuf-btn flex-1 py-3 text-[14px]"
            >
              {isPending ? "Saving..." : "Save milestone"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed text-[13px] font-semibold transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--fg-3)" }}
        >
          + Add milestone
        </button>
      )}

      {/* Milestones list */}
      {milestones.length === 0 && !isAdding && (
        <div className="wuf-card p-8 text-center">
          <div className="text-3xl mb-2">📸</div>
          <p className="text-[14px] font-medium text-[var(--fg-3)]">No milestones yet</p>
          <p className="text-[12px] text-[var(--fg-3)] mt-1">Record Toro&apos;s firsts and special moments!</p>
        </div>
      )}

      <div className="space-y-3">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="wuf-card overflow-hidden">
            {/* Media gallery */}
            {milestone.media && milestone.media.length > 0 && (
              <div className={milestone.media.length === 1 ? "" : "grid grid-cols-2 gap-0.5"}>
                {milestone.media.map((m, i) => (
                  <div key={i} className={`${milestone.media.length === 1 ? "aspect-video" : "aspect-square"} bg-[var(--bg)]`}>
                    {isVideo(m.contentType) ? (
                      <video
                        src={m.url}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-[var(--fg)]">
                    {milestone.title}
                  </h3>
                  {milestone.notes && (
                    <p className="text-[13px] text-[var(--fg-3)] mt-1">{milestone.notes}</p>
                  )}
                  <p className="text-[12px] text-[var(--fg-3)] mt-2">
                    {formatDateTime(milestone.occurredAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(milestone.id)}
                  disabled={isPending}
                  className="text-[var(--fg-3)] hover:text-red-500 text-xs p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
