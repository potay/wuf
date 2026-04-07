import { getCrateStatus, getEventsForDay, getTodayStats } from "@/actions/events";
import { getUpcomingReminders } from "@/actions/reminders";
import { CrateTimer } from "@/components/crate-timer";
import { QuickLogButtons } from "@/components/quick-log-buttons";
import { TodayStats } from "@/components/today-stats";
import { ActivityFeed } from "@/components/activity-feed";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [crateStatus, todayEvents, todayStats, upcomingReminders] =
    await Promise.all([
      getCrateStatus(),
      getEventsForDay(new Date()),
      getTodayStats(),
      getUpcomingReminders(5),
    ]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            🐾 Wuf
          </h1>
          <p className="text-sm text-stone-500">Toro&apos;s daily tracker</p>
        </div>
      </div>

      {/* Crate timer */}
      <CrateTimer
        inCrate={crateStatus.inCrate}
        since={crateStatus.since}
      />

      {/* Quick log */}
      <section>
        <h2 className="text-sm font-semibold text-stone-600 mb-3 uppercase tracking-wide">
          Quick log
        </h2>
        <QuickLogButtons />
      </section>

      {/* Today's stats */}
      <section>
        <h2 className="text-sm font-semibold text-stone-600 mb-3 uppercase tracking-wide">
          Today&apos;s stats
        </h2>
        <TodayStats stats={todayStats} />
      </section>

      {/* Upcoming reminders */}
      {upcomingReminders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
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
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                  🔔
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800 truncate">
                    {reminder.title}
                  </div>
                  <div className="text-xs text-stone-400">
                    {formatDateTime(reminder.dueAt)}
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
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
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
