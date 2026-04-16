import { EVENT_TYPE_CONFIG, type EventType } from "@/db/schema";

interface TodayStatsProps {
  stats: Record<string, number>;
}

const TRACKED_STATS: EventType[] = ["pee", "poop", "meal", "water", "walk", "treat"];

export function TodayStats({ stats }: TodayStatsProps) {
  return (
    <div className="wuf-card p-4">
      <div className="grid grid-cols-6 gap-2">
        {TRACKED_STATS.map((type) => {
          const config = EVENT_TYPE_CONFIG[type];
          const count = stats[type] || 0;
          return (
            <div key={type} className="text-center">
              <div
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-base mb-1"
                style={{ background: config.bg }}
              >
                {config.emoji}
              </div>
              <div className="text-[15px] font-extrabold text-[var(--fg)]">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
