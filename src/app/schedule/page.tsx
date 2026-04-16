import { getSchedule } from "@/actions/schedule";
import { ScheduleView } from "@/components/schedule-view";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const [schedule, user] = await Promise.all([getSchedule(), getCurrentUser()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">📅 Schedule</h1>
        <p className="text-sm text-stone-500">
          {user.puppyName}&apos;s daily routine
        </p>
      </div>
      <ScheduleView items={schedule} canWrite={user.canWrite} />
    </div>
  );
}
