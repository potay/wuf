"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Event } from "@/db/schema";
import { logEvent } from "@/actions/events";
import { formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";

interface WeightViewProps {
  events: Event[];
}

function parseWeight(event: Event): number | null {
  if (!event.metadata) return null;
  try {
    const data = JSON.parse(event.metadata);
    return typeof data.weight === "number" ? data.weight : null;
  } catch {
    return null;
  }
}

export function WeightView({ events }: WeightViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState("");
  const [unit] = useState("lbs");
  const [submitted, setSubmitted] = useState(false);

  const chartData = events
    .map((e) => ({
      date: new Date(e.occurredAt).getTime(),
      weight: parseWeight(e),
      label: format(new Date(e.occurredAt), "MMM d"),
    }))
    .filter((d) => d.weight !== null)
    .sort((a, b) => a.date - b.date);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;

    startTransition(async () => {
      await logEvent("weight", `${w} ${unit}`, JSON.stringify({ weight: w, unit }));
      setWeight("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Log weight form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight"
            className="w-full p-3 pr-12 rounded-xl border border-stone-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
            {unit}
          </span>
        </div>
        <button
          type="submit"
          disabled={isPending || !weight}
          className={`px-6 rounded-xl text-white font-semibold text-sm transition-all
            active:scale-[0.98] disabled:opacity-50
            ${submitted ? "bg-green-500" : "bg-amber-500 hover:bg-amber-600"}`}
        >
          {submitted ? "✓" : isPending ? "..." : "Log"}
        </button>
      </form>

      {/* Weight chart */}
      {chartData.length >= 2 ? (
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-4">
            Growth chart
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#a8a29e" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a8a29e" }}
                tickLine={false}
                unit=" lbs"
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e7e5e4",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-100 p-4 text-center text-stone-400">
          <div className="text-3xl mb-2">📈</div>
          <p className="text-sm">Log at least 2 weights to see the chart</p>
        </div>
      )}

      {/* Weight history */}
      <section>
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">
          History
        </h2>
        {chartData.length === 0 ? (
          <div className="text-center py-4 text-stone-400 text-sm">
            No weights logged yet
          </div>
        ) : (
          <div className="space-y-2">
            {[...chartData].reverse().map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-100"
              >
                <div className="flex items-center gap-2">
                  <span>⚖️</span>
                  <span className="text-sm font-bold text-stone-800">
                    {entry.weight} {unit}
                  </span>
                </div>
                <span className="text-xs text-stone-400">{formatDate(new Date(entry.date))}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
