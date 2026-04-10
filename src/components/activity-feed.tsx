import { EVENT_TYPE_CONFIG, type EventType, type Event } from "@/db/schema";
import { LocalTime } from "@/components/local-time";

interface ActivityFeedProps {
  events: Event[];
  showDate?: boolean;
}

export function ActivityFeed({ events, showDate = false }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="wuf-card p-8 text-center text-[var(--fg-3)]">
        <div className="text-3xl mb-2">🐾</div>
        <p className="text-[14px] font-medium">No activities yet today</p>
      </div>
    );
  }

  return (
    <div className="wuf-card overflow-hidden">
      {events.map((event, i) => {
        const config = EVENT_TYPE_CONFIG[event.type as EventType];
        if (!config) return null;
        return (
          <div
            key={event.id}
            className={`flex items-center gap-3 px-5 py-3.5 ${
              i < events.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: config.bg }}
            >
              {config.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-[var(--fg)]">{config.label}</div>
              {event.notes && (
                <div className="text-[12px] text-[var(--fg-3)] truncate">{event.notes}</div>
              )}
            </div>
            <div className="text-[12px] font-semibold text-[var(--fg-3)] shrink-0">
              <LocalTime date={event.occurredAt} format="time" />
              {showDate && (
                <div className="text-[10px]">
                  <LocalTime date={event.occurredAt} format="ago" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
