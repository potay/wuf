import { getCrateStatus, getEventsForDay, getTodayStats, getLastEventOfType } from "@/actions/events";
import { getUpcomingReminders } from "@/actions/reminders";
import { getSchedule } from "@/actions/schedule";
import { CrateTimer } from "@/components/crate-timer";
import { QuickLogButtons } from "@/components/quick-log-buttons";
import { TodayStats } from "@/components/today-stats";
import { TimeSince } from "@/components/time-since";
import { ActivityFeed } from "@/components/activity-feed";
import { NotificationProvider } from "@/components/notification-provider";
import { ScheduleNotifier } from "@/components/schedule-notifier";
import { TimezoneSetter } from "@/components/timezone-setter";
import { LocalTime } from "@/components/local-time";
import { type EventType } from "@/db/schema";
import { getUserTimezone, getDayBoundsInTimezone } from "@/lib/timezone";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TIME_SINCE_TYPES: EventType[] = ["pee", "poop", "meal", "water"];

export default async function HomePage() {
  const tz = await getUserTimezone();
  const { start, end } = getDayBoundsInTimezone(new Date(), tz);

  const [crateStatus, todayEvents, todayStats, upcomingReminders, schedule, ...lastEventResults] =
    await Promise.all([
      getCrateStatus(),
      getEventsForDay(start, end),
      getTodayStats(start, end),
      getUpcomingReminders(5),
      getSchedule(),
      ...TIME_SINCE_TYPES.map((type) => getLastEventOfType(type)),
    ]);

  const lastEvents: Partial<Record<EventType, Date | null>> = {};
  TIME_SINCE_TYPES.forEach((type, i) => {
    const event = lastEventResults[i];
    lastEvents[type] = event ? event.occurredAt : null;
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <TimezoneSetter />

      {/* Notification permission prompt + schedule checker */}
      <NotificationProvider>
        <ScheduleNotifier items={schedule} />
      </NotificationProvider>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", boxShadow: "0 4px 12px rgba(232,145,58,0.3)" }}
        >
          🐾
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Wuf
          </h1>
          <p className="text-xs font-medium" style={{ color: "#a89585" }}>Toro&apos;s daily tracker</p>
        </div>
      </div>

      {/* Crate timer */}
      <CrateTimer
        inCrate={crateStatus.inCrate}
        since={crateStatus.since}
      />

      {/* Time since */}
      <section>
        <h2 className="wuf-section-title mb-3">
          Time since last
        </h2>
        <TimeSince lastEvents={lastEvents} />
      </section>

      {/* Quick log */}
      <section>
        <h2 className="wuf-section-title mb-3">
          Quick log
        </h2>
        <QuickLogButtons />
      </section>

      {/* Today's stats */}
      <section>
        <h2 className="wuf-section-title mb-3">
          Today&apos;s stats
        </h2>
        <TodayStats stats={todayStats} />
      </section>

      {/* Upcoming reminders */}
      {upcomingReminders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="wuf-section-title">
              Upcoming
            </h2>
            <Link
              href="/reminders"
              className="text-xs text-amber-600 hover:text-amber-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 p-3 wuf-card"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                  🔔
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800 truncate">
                    {reminder.title}
                  </div>
                  <div className="text-xs text-stone-400">
                    <LocalTime date={reminder.dueAt} format="datetime" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="wuf-section-title">
            Today&apos;s activity
          </h2>
          <Link
            href="/history"
            className="text-xs text-amber-600 hover:text-amber-700"
          >
            View all
          </Link>
        </div>
        <ActivityFeed events={todayEvents.slice(0, 10)} />
      </section>
    </div>
  );
}
