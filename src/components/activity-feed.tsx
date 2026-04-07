import { EVENT_TYPE_CONFIG, type EventType, type Event } from "@/db/schema";
import { LocalTime } from "@/components/local-time";

interface ActivityFeedProps {
  events: Event[];
  showDate?: boolean;
}

export function ActivityFeed({ events, showDate = false }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <div className="text-3xl mb-2">🐾</div>
        <p className="text-sm">No activities logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const config = EVENT_TYPE_CONFIG[event.type as EventType];
        if (!config) return null;
        return (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${config.color}`}
            >
              {config.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-800">
                {config.label}
              </div>
              {event.notes && (
                <div className="text-xs text-stone-500 truncate">
                  {event.notes}
                </div>
              )}
            </div>
            <div className="text-xs text-stone-400 text-right shrink-0">
              <div><LocalTime date={event.occurredAt} format="time" /></div>
              {showDate && (
                <div className="text-stone-300">
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
