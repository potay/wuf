import { getCrateStatus, getEventsForDay, getTodayStats, getLastEventOfType } from "@/actions/events";
import { getUpcomingReminders } from "@/actions/reminders";
import { getSchedule } from "@/actions/schedule";
import { getCurrentUser } from "@/lib/session";
import { CrateTimer } from "@/components/crate-timer";
import { QuickLogButtons } from "@/components/quick-log-buttons";
import { TodayStats } from "@/components/today-stats";
import { TimeSince } from "@/components/time-since";
import { ActivityFeed } from "@/components/activity-feed";
import { NotificationProvider } from "@/components/notification-provider";
import { ScheduleNotifier } from "@/components/schedule-notifier";
import { TimezoneSetter } from "@/components/timezone-setter";
import { LocalTime } from "@/components/local-time";
import { PuppyAvatar } from "@/components/puppy-avatar";
import { type EventType } from "@/db/schema";
import { getUserTimezone, getDayBoundsInTimezone } from "@/lib/timezone";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TIME_SINCE_TYPES: EventType[] = ["pee", "poop", "meal", "water"];

export default async function HomePage() {
  const tz = await getUserTimezone();
  const { start, end } = getDayBoundsInTimezone(new Date(), tz);

  const [user, crateStatus, todayEvents, todayStats, upcomingReminders, schedule, ...lastEventResults] =
    await Promise.all([
      getCurrentUser(),
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
    <div className="min-h-screen">
      <TimezoneSetter />

      <NotificationProvider>
        <ScheduleNotifier items={schedule} />
      </NotificationProvider>

      {/* Hero header */}
      <div
        className="px-5 pt-10 pb-6 rounded-b-[32px]"
        style={{ background: "var(--hero)", color: "var(--hero-fg)" }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-end gap-4 mb-5">
            <PuppyAvatar
              illustrationUrl={user.profile.illustrationUrl ?? null}
              breed={user.profile.breed || ""}
              puppyName={user.puppyName}
              className="w-24 h-24 -mb-1"
            />
            <div className="flex-1 pb-2">
              <p className="text-[12px] opacity-50 font-medium">Good day!</p>
              <h1 className="text-[22px] text-white leading-tight">{user.puppyName}&apos;s<br/>Dashboard</h1>
            </div>
          </div>
          <CrateTimer inCrate={crateStatus.inCrate} since={crateStatus.since} puppyName={user.puppyName} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 -mt-4 space-y-6 pb-6">
        {/* Time since */}
        <TimeSince lastEvents={lastEvents} />

        {/* Quick log */}
        <section>
          <h2 className="wuf-section-title mb-4">Quick Log</h2>
          <QuickLogButtons />
        </section>

        {/* Today's counts */}
        <section>
          <h2 className="wuf-section-title mb-3">Today&apos;s Count</h2>
          <TodayStats stats={todayStats} />
        </section>

        {/* Upcoming reminders */}
        {upcomingReminders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="wuf-section-title">Upcoming</h2>
              <Link href="/reminders" className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="wuf-card flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--accent-light)" }}>
                    <span className="text-[16px] font-black" style={{ color: "var(--accent)" }}>!</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[var(--fg)] truncate">
                      {reminder.title}
                    </div>
                    <div className="text-[12px] text-[var(--fg-3)]">
                      <LocalTime date={reminder.dueAt} format="datetime" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="wuf-section-title">Activity</h2>
            <Link href="/history" className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>
              See all
            </Link>
          </div>
          <ActivityFeed events={todayEvents.slice(0, 8)} />
        </section>
      </div>
    </div>
  );
}
