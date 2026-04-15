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

type Unit = "lbs" | "kg";

const LBS_PER_KG = 2.20462;

function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

/** Convert any stored weight to the target display unit. */
function convertWeight(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "kg" && toUnit === "lbs") return kgToLbs(value);
  return lbsToKg(value);
}

function parseWeightEntry(event: Event): { weight: number; unit: Unit } | null {
  if (!event.metadata) return null;
  try {
    const data = JSON.parse(event.metadata);
    if (typeof data.weight !== "number") return null;
    const unit: Unit = data.unit === "kg" ? "kg" : "lbs";
    return { weight: data.weight, unit };
  } catch {
    return null;
  }
}

export function WeightView({ events }: WeightViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState("");
  const [inputUnit, setInputUnit] = useState<Unit>("lbs");
  const [displayUnit, setDisplayUnit] = useState<Unit>("lbs");
  const [submitted, setSubmitted] = useState(false);

  const chartData = events
    .map((e) => {
      const parsed = parseWeightEntry(e);
      if (!parsed) return null;
      return {
        date: new Date(e.occurredAt).getTime(),
        weight: convertWeight(parsed.weight, parsed.unit, displayUnit),
        originalWeight: parsed.weight,
        originalUnit: parsed.unit,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => a.date - b.date);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;

    startTransition(async () => {
      await logEvent(
        "weight",
        `${w} ${inputUnit}`,
        JSON.stringify({ weight: w, unit: inputUnit })
      );
      setWeight("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      router.refresh();
    });
  }

  const minDate = chartData[0]?.date;
  const maxDate = chartData[chartData.length - 1]?.date;

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
            className="w-full p-3 pr-16 rounded-xl border border-stone-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-stone-300"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex bg-stone-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setInputUnit("lbs")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                inputUnit === "lbs" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400"
              }`}
            >
              lbs
            </button>
            <button
              type="button"
              onClick={() => setInputUnit("kg")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                inputUnit === "kg" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400"
              }`}
            >
              kg
            </button>
          </div>
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

      {/* Display unit toggle */}
      {chartData.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Display in
          </span>
          <div className="flex bg-stone-100 rounded-lg p-0.5">
            <button
              onClick={() => setDisplayUnit("lbs")}
              className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-colors ${
                displayUnit === "lbs" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400"
              }`}
            >
              lbs
            </button>
            <button
              onClick={() => setDisplayUnit("kg")}
              className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-colors ${
                displayUnit === "kg" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400"
              }`}
            >
              kg
            </button>
          </div>
        </div>
      )}

      {/* Weight chart */}
      {chartData.length >= 2 ? (
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-4">
            Growth chart
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={[minDate!, maxDate!]}
                tickFormatter={(ts) => format(new Date(ts), "MMM d")}
                tick={{ fontSize: 11, fill: "#a8a29e" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a8a29e" }}
                tickLine={false}
                unit={` ${displayUnit}`}
                domain={["dataMin - 1", "dataMax + 1"]}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e7e5e4",
                  fontSize: 12,
                }}
                labelFormatter={(ts) => format(new Date(ts as number), "MMM d, yyyy")}
                formatter={(value) => [`${(value as number).toFixed(1)} ${displayUnit}`, "Weight"]}
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
                    {entry.weight.toFixed(1)} {displayUnit}
                  </span>
                  {entry.originalUnit !== displayUnit && (
                    <span className="text-[11px] text-stone-400">
                      ({entry.originalWeight} {entry.originalUnit} logged)
                    </span>
                  )}
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
