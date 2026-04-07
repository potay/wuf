"use client";

import { type Event, type EventType, EVENT_TYPE_CONFIG } from "@/db/schema";
import { differenceInMinutes, format, isToday, isYesterday, subDays } from "date-fns";

interface InsightsViewProps {
  events: Event[];
}

type IntervalStats = {
  avgMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  count: number;
};

function computeIntervals(events: Event[], type: EventType): IntervalStats | null {
  const filtered = events
    .filter((e) => e.type === type)
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  if (filtered.length < 2) return null;

  const intervals: number[] = [];
  for (let i = 1; i < filtered.length; i++) {
    const diff = differenceInMinutes(
      new Date(filtered[i].occurredAt),
      new Date(filtered[i - 1].occurredAt)
    );
    // Ignore intervals > 12 hours (likely overnight)
    if (diff < 720) {
      intervals.push(diff);
    }
  }

  if (intervals.length === 0) return null;

  return {
    avgMinutes: Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length),
    minMinutes: Math.min(...intervals),
    maxMinutes: Math.max(...intervals),
    count: filtered.length,
  };
}

function computeHourDistribution(events: Event[], type: EventType): number[] {
  const hours = new Array(24).fill(0);
  events
    .filter((e) => e.type === type)
    .forEach((e) => {
      const hour = new Date(e.occurredAt).getHours();
      hours[hour]++;
    });
  return hours;
}

function computeMealToPottyDelay(events: Event[]): number | null {
  const meals = events
    .filter((e) => e.type === "meal")
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  const pees = events
    .filter((e) => e.type === "pee" || e.type === "poop")
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  if (meals.length === 0 || pees.length === 0) return null;

  const delays: number[] = [];
  for (const meal of meals) {
    const mealTime = new Date(meal.occurredAt).getTime();
    // Find the first potty event after this meal (within 2 hours)
    const nextPotty = pees.find((p) => {
      const pTime = new Date(p.occurredAt).getTime();
      return pTime > mealTime && pTime - mealTime < 120 * 60 * 1000;
    });
    if (nextPotty) {
      delays.push(differenceInMinutes(new Date(nextPotty.occurredAt), new Date(meal.occurredAt)));
    }
  }

  if (delays.length === 0) return null;
  return Math.round(delays.reduce((a, b) => a + b, 0) / delays.length);
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function HourChart({ hours, color }: { hours: number[]; color: string }) {
  const max = Math.max(...hours, 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {hours.map((count, hour) => (
        <div key={hour} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className={`w-full rounded-sm ${color}`}
            style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? 2 : 0 }}
          />
          {hour % 6 === 0 && (
            <span className="text-[8px] text-stone-400">{hour}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DailyCountsLast7Days({ events, type }: { events: Event[]; type: EventType }) {
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const count = events.filter((e) => {
      const t = new Date(e.occurredAt).getTime();
      return e.type === type && t >= dayStart.getTime() && t <= dayEnd.getTime();
    }).length;

    let label: string;
    if (isToday(day)) label = "Today";
    else if (isYesterday(day)) label = "Yest";
    else label = format(day, "EEE");

    days.push({ label, count });
  }

  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-2 h-20">
      {days.map((day) => (
        <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-mono text-stone-600">{day.count}</span>
          <div
            className="w-full rounded-t-md bg-amber-300"
            style={{ height: `${(day.count / max) * 100}%`, minHeight: day.count > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-stone-400">{day.label}</span>
        </div>
      ))}
    </div>
  );
}

export function InsightsView({ events }: InsightsViewProps) {
  const peeStats = computeIntervals(events, "pee");
  const poopStats = computeIntervals(events, "poop");
  const mealToPotty = computeMealToPottyDelay(events);
  const peeHours = computeHourDistribution(events, "pee");
  const poopHours = computeHourDistribution(events, "poop");
  const accidentCount = events.filter((e) => e.type === "accident").length;

  if (events.length < 3) {
    return (
      <div className="text-center py-12 text-stone-400">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm">Log a few more events to see patterns!</p>
        <p className="text-xs mt-1">Need at least a few days of data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interval stats */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
          Average intervals
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { type: "pee" as EventType, stats: peeStats },
            { type: "poop" as EventType, stats: poopStats },
          ].map(({ type, stats }) => {
            const config = EVENT_TYPE_CONFIG[type];
            return (
              <div key={type} className="bg-white rounded-xl border border-stone-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>{config.emoji}</span>
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                {stats ? (
                  <>
                    <div className="text-2xl font-bold text-stone-800">
                      {formatMinutes(stats.avgMinutes)}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      Range: {formatMinutes(stats.minMinutes)} - {formatMinutes(stats.maxMinutes)}
                    </div>
                    <div className="text-xs text-stone-400">
                      {stats.count} total events
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-stone-400">Not enough data</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Meal to potty correlation */}
      {mealToPotty !== null && (
        <section className="bg-white rounded-xl border border-stone-100 p-4">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">
            Meal to potty
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍖 → 💧</span>
            <div>
              <div className="text-2xl font-bold text-stone-800">
                ~{formatMinutes(mealToPotty)}
              </div>
              <div className="text-xs text-stone-400">
                Average time from meal to first bathroom break
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Time of day distribution */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
          Time of day patterns
        </h2>
        <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-4">
          <div>
            <div className="text-xs font-medium text-stone-500 mb-2">
              💧 Pee by hour
            </div>
            <HourChart hours={peeHours} color="bg-yellow-400" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500 mb-2">
              💩 Poop by hour
            </div>
            <HourChart hours={poopHours} color="bg-amber-400" />
          </div>
        </div>
      </section>

      {/* 7-day trends */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
          Last 7 days
        </h2>
        <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-4">
          <div>
            <div className="text-xs font-medium text-stone-500 mb-2">
              💧 Pee count per day
            </div>
            <DailyCountsLast7Days events={events} type="pee" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500 mb-2">
              💩 Poop count per day
            </div>
            <DailyCountsLast7Days events={events} type="poop" />
          </div>
        </div>
      </section>

      {/* Accident summary */}
      <section className="bg-white rounded-xl border border-stone-100 p-4">
        <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">
          Accidents
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <div className="text-2xl font-bold text-stone-800">{accidentCount}</div>
            <div className="text-xs text-stone-400">Total accidents logged</div>
          </div>
        </div>
      </section>
    </div>
  );
}
