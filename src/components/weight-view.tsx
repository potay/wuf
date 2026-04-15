"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Event } from "@/db/schema";
import { logEvent } from "@/actions/events";
import { formatDate } from "@/lib/utils";
import { getBreedPrior } from "@/lib/breed-data";
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
  momWeightLbs: number | null;
  dadWeightLbs: number | null;
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

interface PriorInfo {
  /** Expected adult weight in display unit */
  expectedAdultWeight: number;
  /** Strength of the prior (higher = trust prior more) */
  strength: number;
  /** Source description for UI */
  source: string;
}

/**
 * Compute the prior on adult weight from breed and parent weights.
 * Parent weights override breed if available.
 */
function computePrior(
  breed: string,
  momWeightLbs: number | null,
  dadWeightLbs: number | null,
  displayUnit: Unit
): PriorInfo {
  // Parent weights (most accurate predictor for puppy adult weight)
  if (momWeightLbs && dadWeightLbs) {
    const avgLbs = (momWeightLbs + dadWeightLbs) / 2;
    return {
      expectedAdultWeight: displayUnit === "lbs" ? avgLbs : lbsToKg(avgLbs),
      strength: 1.5, // strong prior
      source: `parent average (${momWeightLbs} + ${dadWeightLbs}) / 2`,
    };
  }
  if (momWeightLbs || dadWeightLbs) {
    // Single parent - use it but with reduced strength
    const lbs = momWeightLbs || dadWeightLbs!;
    return {
      expectedAdultWeight: displayUnit === "lbs" ? lbs : lbsToKg(lbs),
      strength: 0.8,
      source: momWeightLbs ? `mom's weight` : `dad's weight`,
    };
  }

  // Fall back to breed prior
  const breedPrior = getBreedPrior(breed);
  const expectedLbs = breedPrior.meanAdultWeightLbs;
  return {
    expectedAdultWeight: displayUnit === "lbs" ? expectedLbs : lbsToKg(expectedLbs),
    strength: breedPrior.matched ? 0.5 : 0.2,
    source: breedPrior.matched
      ? `${breedPrior.matchedName} typical (${breedPrior.adultWeightLbs.min}–${breedPrior.adultWeightLbs.max} lbs)`
      : `medium-breed default`,
  };
}

/**
 * Fit logistic growth: weight = A * (1 - exp(-k * ageDays))
 * with regularization toward a prior expected adult weight.
 *
 * totalError = sum((predicted - actual)^2) + lambda * (A - priorA)^2
 *
 * Lambda scales with prior strength and inversely with data quantity.
 */
function fitGrowthCurve(
  points: { ageDays: number; weight: number }[],
  prior?: { expectedAdultWeight: number; strength: number }
): { adultWeight: number; k: number; rmse: number } | null {
  if (points.length < 2) return null;

  const currentMax = Math.max(...points.map(p => p.weight));

  // Prior weight: scale by prior strength, weaken with more data points
  const lambda = prior ? prior.strength * (10 / Math.max(points.length, 1)) : 0;
  const priorA = prior?.expectedAdultWeight ?? 0;

  // Search ranges - use prior to bias the range if available
  const minA = prior
    ? Math.max(currentMax, prior.expectedAdultWeight * 0.5)
    : currentMax * 1.0;
  const maxA = prior
    ? Math.min(currentMax * 15, prior.expectedAdultWeight * 2.5)
    : currentMax * 10;

  let best = { A: priorA || currentMax * 2, k: 0.01, err: Infinity };

  for (let A = minA; A <= maxA; A += (maxA - minA) / 60) {
    for (let k = 0.001; k <= 0.05; k += 0.0005) {
      let dataErr = 0;
      for (const p of points) {
        const predicted = A * (1 - Math.exp(-k * p.ageDays));
        dataErr += (predicted - p.weight) ** 2;
      }
      const priorErr = lambda * (A - priorA) ** 2;
      const totalErr = dataErr + priorErr;
      if (totalErr < best.err) {
        best = { A, k, err: totalErr };
      }
    }
  }

  // Compute RMSE on data only (without prior penalty)
  let dataErr = 0;
  for (const p of points) {
    const predicted = best.A * (1 - Math.exp(-best.k * p.ageDays));
    dataErr += (predicted - p.weight) ** 2;
  }
  const rmse = Math.sqrt(dataErr / points.length);
  return { adultWeight: best.A, k: best.k, rmse };
}

/** Compute age (in days) at which puppy reaches a given fraction of adult weight. */
function ageAtFraction(k: number, fraction: number): number {
  if (fraction <= 0 || fraction >= 1) return NaN;
  return -Math.log(1 - fraction) / k;
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
  const stepDays = Math.max(7, Math.round((untilDate - p2.date) / (30 * 86400000)));
  const stepMs = stepDays * 86400000;
  for (let t = p2.date; t <= untilDate; t += stepMs) {
    const w = slope * t + intercept;
    if (w > 0) result.push({ date: t, weight: w });
  }
  return result;
}

const MILESTONES = [
  { fraction: 0.5, label: "50% — half size" },
  { fraction: 0.75, label: "75% — almost there" },
  { fraction: 0.95, label: "95% — full grown" },
] as const;

export function WeightView({ events, birthday, breed, momWeightLbs, dadWeightLbs }: WeightViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState("");
  const [inputUnit, setInputUnit] = useState<Unit>("lbs");
  const [displayUnit, setDisplayUnit] = useState<Unit>("lbs");
  const [submitted, setSubmitted] = useState(false);
  const [showProjection, setShowProjection] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);

  const birthdayDate = useMemo(() => birthday ? new Date(birthday + "T00:00:00") : null, [birthday]);

  const prior = useMemo(
    () => computePrior(breed, momWeightLbs, dadWeightLbs, displayUnit),
    [breed, momWeightLbs, dadWeightLbs, displayUnit]
  );

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

  const projection = useMemo(() => {
    if (!showProjection || actualData.length < 2 || !birthdayDate) return null;

    const points = actualData.map(d => ({
      ageDays: differenceInDays(new Date(d.date), birthdayDate),
      weight: d.weight,
    }));

    const fit = fitGrowthCurve(points, prior);
    if (!fit) return null;

    // Project forward to a reasonable end date
    const lastDate = actualData[actualData.length - 1].date;
    const twoYearsFromBirth = addDays(birthdayDate, 2 * DAYS_PER_YEAR).getTime();
    const oneYearFromLast = addDays(new Date(lastDate), DAYS_PER_YEAR).getTime();
    const projectionEnd = Math.max(twoYearsFromBirth, oneYearFromLast);

    const projectedPoints: { date: number; projected: number }[] = [];
    const stepMs = 7 * 86400000;
    for (let t = lastDate; t <= projectionEnd; t += stepMs) {
      const ageDays = differenceInDays(new Date(t), birthdayDate);
      if (ageDays < 0) continue;
      const w = fit.adultWeight * (1 - Math.exp(-fit.k * ageDays));
      projectedPoints.push({ date: t, projected: w });
    }

    // Compute milestone dates
    const milestones = MILESTONES.map(m => {
      const ageDays = ageAtFraction(fit.k, m.fraction);
      const date = isFinite(ageDays) ? addDays(birthdayDate, ageDays).getTime() : null;
      return {
        fraction: m.fraction,
        label: m.label,
        weight: fit.adultWeight * m.fraction,
        date,
      };
    });

    return {
      points: projectedPoints,
      adultWeight: fit.adultWeight,
      rmse: fit.rmse,
      milestones,
    };
  }, [actualData, birthdayDate, prior, showProjection]);

  const linearProjection = useMemo(() => {
    if (!showProjection || actualData.length < 2 || birthdayDate) return null;
    const lastDate = actualData[actualData.length - 1].date;
    const end = lastDate + 180 * 86400000;
    const points = linearExtrapolate(actualData, end);
    return points.map(p => ({ date: p.date, projected: p.weight }));
  }, [actualData, birthdayDate, showProjection]);

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
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
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

          {/* Milestone timeline */}
          <div>
            <div className="text-[11px] text-stone-500 uppercase tracking-wide mb-2">
              Milestones
            </div>
            <div className="space-y-1.5">
              {projection.milestones.map((m) => {
                const reached = currentWeight !== undefined && currentWeight >= m.weight;
                return (
                  <div key={m.fraction} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className={reached ? "text-green-600" : "text-stone-400"}>
                        {reached ? "✓" : "○"}
                      </span>
                      <span className={reached ? "text-stone-700 line-through" : "text-stone-700"}>
                        {m.label} ({m.weight.toFixed(1)} {displayUnit})
                      </span>
                    </div>
                    <span className="text-stone-500 text-[11px]">
                      {m.date ? format(new Date(m.date), "MMM yyyy") : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-stone-500 italic pt-1 border-t border-amber-200">
            Prior: {prior.source} · {actualData.length} data point{actualData.length === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {/* Methodology - collapsible */}
      {projection && (
        <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
          >
            <span className="text-sm font-semibold text-stone-600">
              📐 How is this calculated?
            </span>
            <span className="text-stone-400 text-xs">
              {showMethodology ? "▲" : "▼"}
            </span>
          </button>
          {showMethodology && (
            <div className="px-4 pb-4 space-y-3 text-[13px] text-stone-600 leading-relaxed border-t border-stone-100">
              <div className="pt-3">
                <div className="font-semibold text-stone-700 mb-1">The growth model</div>
                <p>
                  We fit a logistic curve to your data:
                </p>
                <div className="bg-stone-50 rounded-lg px-3 py-2 my-1.5 font-mono text-[12px] text-stone-700">
                  weight = A × (1 − e<sup>−k × age</sup>)
                </div>
                <p className="text-[12px] text-stone-500">
                  Puppies grow rapidly at first, then slow down as they approach adult size.
                  <strong className="text-stone-700"> A</strong> is the asymptotic adult weight,
                  <strong className="text-stone-700"> k</strong> is how fast they get there.
                  We solve for both A and k together via a 2D grid search (60 × 100 combinations),
                  picking the pair that minimizes total error.
                </p>
              </div>

              <div>
                <div className="font-semibold text-stone-700 mb-1">Three signals, ranked by strength</div>
                <ol className="list-decimal list-inside space-y-1 text-[12px]">
                  <li>
                    <strong className="text-stone-700">Parent weights</strong> — strongest predictor.
                    Puppies tend to land between mom and dad.
                  </li>
                  <li>
                    <strong className="text-stone-700">Breed match</strong> — typical adult range
                    for the breed (we know 40+ common breeds).
                  </li>
                  <li>
                    <strong className="text-stone-700">Size category default</strong> — fallback
                    when breed is unknown.
                  </li>
                </ol>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] bg-stone-50 rounded-lg px-3 py-2">
                  <span className="text-stone-500">Both parents</span><span className="font-mono text-stone-700">strength = 1.5</span>
                  <span className="text-stone-500">One parent</span><span className="font-mono text-stone-700">strength = 0.8</span>
                  <span className="text-stone-500">Known breed</span><span className="font-mono text-stone-700">strength = 0.5</span>
                  <span className="text-stone-500">Unknown breed</span><span className="font-mono text-stone-700">strength = 0.2</span>
                </div>
                <p className="text-[12px] text-stone-500 mt-1">
                  Currently using: <span className="font-mono text-stone-700">{prior.source}</span> (strength {prior.strength})
                </p>
              </div>

              <div>
                <div className="font-semibold text-stone-700 mb-1">Regularization</div>
                <p className="text-[12px]">
                  We balance fitting your actual measurements against the prior expected adult weight:
                </p>
                <div className="bg-stone-50 rounded-lg px-3 py-2 my-1.5 font-mono text-[12px] text-stone-700">
                  error = data_error + λ × (A − prior_A)²
                </div>
                <p className="text-[12px] text-stone-500">
                  λ scales with prior strength and weakens with more data points:
                </p>
                <div className="bg-stone-50 rounded-lg px-3 py-2 my-1.5 font-mono text-[12px] text-stone-700">
                  λ = strength × (10 / data_count)
                </div>
                <p className="text-[12px] text-stone-500">
                  Example with both parents (strength 1.5):
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] bg-stone-50 rounded-lg px-3 py-2 mt-1">
                  <span className="text-stone-500">2 data points</span><span className="font-mono text-stone-700">λ = 7.5 (heavy prior)</span>
                  <span className="text-stone-500">5 data points</span><span className="font-mono text-stone-700">λ = 3.0</span>
                  <span className="text-stone-500">10 data points</span><span className="font-mono text-stone-700">λ = 1.5</span>
                  <span className="text-stone-500">20 data points</span><span className="font-mono text-stone-700">λ = 0.75 (data wins)</span>
                </div>
                <p className="text-[12px] text-stone-500 mt-1">
                  Without this, 2-3 early measurements could fit a runaway curve. The prior keeps
                  early estimates sane until you have enough data.
                </p>
              </div>

              <div>
                <div className="font-semibold text-stone-700 mb-1">Milestone dates</div>
                <p className="text-[12px]">
                  We invert the curve to find when puppy reaches X% of adult weight:
                </p>
                <div className="bg-stone-50 rounded-lg px-3 py-2 my-1.5 font-mono text-[12px] text-stone-700">
                  age = −ln(1 − fraction) / k
                </div>
                <p className="text-[12px] text-stone-500">
                  For 95% full-grown, this is roughly{" "}
                  <span className="font-mono text-stone-700">3 / k</span> days after birthday.
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <div className="font-semibold text-stone-700 mb-1">Caveats</div>
                <ul className="list-disc list-inside space-y-1 text-[12px] text-stone-500">
                  <li>Accuracy improves significantly with more data points (aim for 5+)</li>
                  <li>The model assumes smooth growth — doesn&apos;t capture growth spurts</li>
                  <li>Large breeds keep filling out muscle mass past their height plateau</li>
                  <li>The prior only constrains A (adult weight), not k (growth rate) — k is fit purely from data</li>
                  <li>The 95% &quot;full grown&quot; threshold is approximate</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
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
                tickFormatter={(ts) => format(new Date(ts), "MMM yy")}
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
          {birthdayDate && !momWeightLbs && !dadWeightLbs && (
            <p className="text-[11px] text-stone-400 italic mt-2 text-center">
              Tip: add parent weights on the profile page for a more accurate projection.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-100 p-4 text-center text-stone-400">
          <div className="text-3xl mb-2">📈</div>
          <p className="text-sm">Log at least 2 weights to see the chart</p>
        </div>
      )}

      {/* History */}
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
