import { getAllEvents } from "@/actions/events";
import { InsightsView } from "@/components/insights-view";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [events, user] = await Promise.all([getAllEvents(500), getCurrentUser()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">📊 Insights</h1>
        <p className="text-sm text-stone-500">
          {user.puppyName}&apos;s patterns and trends
        </p>
      </div>
      <InsightsView events={events} />
    </div>
  );
}
