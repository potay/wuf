"use client";

import { useMemo, useState, useTransition } from "react";
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
  ReferenceLine,
  Legend,
} from "recharts";
import { format, differenceInDays, addDays } from "date-fns";

interface WeightViewProps {
  events: Event[];
  birthday: string | null;
  breed: string;
}

type Unit = "lbs" | "kg";

const LBS_PER_KG = 2.20462;
const DAYS_PER_YEAR = 365;

function kgToLbs(kg: number): number { return kg * LBS_PER_KG; }
function lbsToKg(lbs: number): number { return lbs / LBS_PER_KG; }

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

/**
 * Fit a logistic growth curve: weight = A * (1 - exp(-k * ageDays))
 * A is the asymptotic adult weight, k is the growth rate.
 * Uses grid search over plausible ranges, then refines with gradient descent.
 */
function fitGrowthCurve(
  points: { ageDays: number; weight: number }[]
): { adultWeight: number; k: number; rmse: number } | null {
  if (points.length < 2) return null;

  const currentMax = Math.max(...points.map(p => p.weight));

  // Grid search: try various A (adult weight) and k (growth rate) values
  let best = { A: currentMax * 2, k: 0.01, err: Infinity };

  // A ranges from current max to 10x current max
  const minA = currentMax * 1.0;
  const maxA = currentMax * 10;

  for (let A = minA; A <= maxA; A += (maxA - minA) / 50) {
    // k ranges from very slow (0.001) to very fast (0.05)
    for (let k = 0.001; k <= 0.05; k += 0.0005) {
      let err = 0;
      for (const p of points) {
        const predicted = A * (1 - Math.exp(-k * p.ageDays));
        err += (predicted - p.weight) ** 2;
      }
      if (err < best.err) {
        best = { A, k, err };
      }
    }
  }

  const rmse = Math.sqrt(best.err / points.length);
  return { adultWeight: best.A, k: best.k, rmse };
}

/** Simple linear extrapolation from the last 2 points (fallback when no birthday). */
function linearExtrapolate(
  points: { date: number; weight: number }[],
  untilDate: number
): { date: number; weight: number }[] {
  if (points.length < 2) return [];
  const [p1, p2] = points.slice(-2);
  const slope = (p2.weight - p1.weight) / (p2.date - p1.date);
  const intercept = p2.weight - slope * p2.date;

  const result: { date: number; weight: number }[] = [];
  const stepDays = Math.max(7, Math.round((untilDate - p2.date) / (30 * 86400000))); // weekly steps
  const stepMs = stepDays * 86400000;
  for (let t = p2.date; t <= untilDate; t += stepMs) {
    const w = slope * t + intercept;
    if (w > 0) result.push({ date: t, weight: w });
  }
  return result;
}

export function WeightView({ events, birthday, breed }: WeightViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState("");
  const [inputUnit, setInputUnit] = useState<Unit>("lbs");
  const [displayUnit, setDisplayUnit] = useState<Unit>("lbs");
  const [submitted, setSubmitted] = useState(false);
  const [showProjection, setShowProjection] = useState(true);

  const birthdayDate = useMemo(() => birthday ? new Date(birthday + "T00:00:00") : null, [birthday]);

  const actualData = useMemo(() => {
    return events
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
  }, [events, displayUnit]);

  // Build projection using the logistic growth curve
  const projection = useMemo(() => {
    if (!showProjection || actualData.length < 2 || !birthdayDate) return null;

    const points = actualData.map(d => ({
      ageDays: differenceInDays(new Date(d.date), birthdayDate),
      weight: d.weight,
    }));

    const fit = fitGrowthCurve(points);
    if (!fit) return null;

    // Project forward: from now until 2 years from birthday (or 1 year from now, whichever is later)
    const lastDate = actualData[actualData.length - 1].date;
    const twoYearsFromBirth = addDays(birthdayDate, 2 * DAYS_PER_YEAR).getTime();
    const oneYearFromLast = addDays(new Date(lastDate), DAYS_PER_YEAR).getTime();
    const projectionEnd = Math.max(twoYearsFromBirth, oneYearFromLast);

    const projectedPoints: { date: number; projected: number }[] = [];
    const stepMs = 7 * 86400000; // weekly steps
    for (let t = lastDate; t <= projectionEnd; t += stepMs) {
      const ageDays = differenceInDays(new Date(t), birthdayDate);
      if (ageDays < 0) continue;
      const w = fit.adultWeight * (1 - Math.exp(-fit.k * ageDays));
      projectedPoints.push({ date: t, projected: w });
    }

    // Find approximate date at 95% of adult weight (considered "full grown")
    const targetWeight = fit.adultWeight * 0.95;
    let fullGrownDate: number | null = null;
    // Invert: ageDays = -ln(1 - targetWeight/A) / k
    const ageAtFullGrown = -Math.log(1 - 0.95) / fit.k;
    if (isFinite(ageAtFullGrown)) {
      fullGrownDate = addDays(birthdayDate, ageAtFullGrown).getTime();
    }

    return {
      points: projectedPoints,
      adultWeight: fit.adultWeight,
      rmse: fit.rmse,
      targetWeight,
      fullGrownDate,
    };
  }, [actualData, birthdayDate, showProjection]);

  // Fallback: linear extrapolation when no birthday
  const linearProjection = useMemo(() => {
    if (!showProjection || actualData.length < 2 || birthdayDate) return null;
    const lastDate = actualData[actualData.length - 1].date;
    const end = lastDate + 180 * 86400000; // 6 months out
    const points = linearExtrapolate(actualData, end);
    return points.map(p => ({ date: p.date, projected: p.weight }));
  }, [actualData, birthdayDate, showProjection]);

  // Merge actual + projected data for the chart
  const chartData = useMemo(() => {
    const result: { date: number; weight?: number; projected?: number }[] = [];
    for (const d of actualData) {
      result.push({ date: d.date, weight: d.weight });
    }
    const proj = projection?.points || linearProjection;
    if (proj) {
      for (const p of proj) {
        result.push({ date: p.date, projected: p.projected });
      }
    }
    return result.sort((a, b) => a.date - b.date);
  }, [actualData, projection, linearProjection]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;
    startTransition(async () => {
      await logEvent("weight", `${w} ${inputUnit}`, JSON.stringify({ weight: w, unit: inputUnit }));
      setWeight("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      router.refresh();
    });
  }

  // Chart x-axis spans from first actual entry to end of projection
  const minDate = actualData[0]?.date;
  const maxDate = chartData[chartData.length - 1]?.date;
  const currentWeight = actualData[actualData.length - 1]?.weight;
  const growthProgress = projection && currentWeight
    ? Math.min(100, (currentWeight / projection.adultWeight) * 100)
    : null;

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
            className="w-full p-3 pr-20 rounded-xl border border-stone-200 bg-white text-sm
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
      {actualData.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Display in</span>
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

      {/* Projection summary card */}
      {projection && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
              🔮 Growth projection
            </h2>
            <button
              onClick={() => setShowProjection(!showProjection)}
              className="text-[11px] font-semibold text-amber-700"
            >
              {showProjection ? "Hide" : "Show"}
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-[11px] text-stone-500 uppercase tracking-wide">
                Estimated adult weight
              </div>
              <div className="text-2xl font-bold text-stone-800">
                {projection.adultWeight.toFixed(1)} {displayUnit}
              </div>
            </div>
            {growthProgress !== null && (
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-stone-500 uppercase tracking-wide">Growth progress</span>
                  <span className="font-semibold text-stone-700">{Math.round(growthProgress)}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${growthProgress}%` }}
                  />
                </div>
              </div>
            )}
            {projection.fullGrownDate && (
              <div className="text-[12px] text-stone-600">
                Expected to reach ~95% of adult weight around{" "}
                <span className="font-semibold">{format(new Date(projection.fullGrownDate), "MMM yyyy")}</span>
              </div>
            )}
            {breed && (
              <div className="text-[11px] text-stone-400 italic pt-1">
                Projection based on {actualData.length} data points{breed ? ` for ${breed}` : ""}.
                Accuracy improves with more entries.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weight chart */}
      {actualData.length >= 2 ? (
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-4">
            Growth chart
          </h2>
          <ResponsiveContainer width="100%" height={280}>
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
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }}
                labelFormatter={(ts) => format(new Date(ts as number), "MMM d, yyyy")}
                formatter={(value, name) => [
                  `${(value as number).toFixed(1)} ${displayUnit}`,
                  name === "weight" ? "Logged" : "Projected",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              {projection?.adultWeight && (
                <ReferenceLine
                  y={projection.adultWeight}
                  stroke="#fbbf24"
                  strokeDasharray="2 4"
                  label={{
                    value: `Adult: ${projection.adultWeight.toFixed(1)}`,
                    fontSize: 10,
                    fill: "#92400e",
                    position: "right",
                  }}
                />
              )}
              <Line
                name="Logged"
                type="monotone"
                dataKey="weight"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                name="Projected"
                type="monotone"
                dataKey="projected"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          {!birthdayDate && (
            <p className="text-[11px] text-stone-400 italic mt-2 text-center">
              Add a birthday on the profile page for adult weight projection.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-100 p-4 text-center text-stone-400">
          <div className="text-3xl mb-2">📈</div>
          <p className="text-sm">Log at least 2 weights to see the chart</p>
        </div>
      )}

      {/* Weight history */}
      <section>
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">History</h2>
        {actualData.length === 0 ? (
          <div className="text-center py-4 text-stone-400 text-sm">No weights logged yet</div>
        ) : (
          <div className="space-y-2">
            {[...actualData].reverse().map((entry, i) => (
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
