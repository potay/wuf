import { EVENT_TYPE_CONFIG, type EventType } from "@/db/schema";

interface TodayStatsProps {
  stats: Partial<Record<EventType, number>>;
}

const TRACKED_STATS: EventType[] = ["pee", "poop", "meal", "water", "walk", "treat"];

export function TodayStats({ stats }: TodayStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TRACKED_STATS.map((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        const count = stats[type] || 0;
        return (
          <div
            key={type}
            className="flex items-center gap-2 wuf-card p-3"
          >
            <span className="text-lg">{config.emoji}</span>
            <div>
              <div className="text-lg font-bold text-stone-800">{count}</div>
              <div className="text-xs text-stone-400">{config.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
