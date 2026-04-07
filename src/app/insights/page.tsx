import { getAllEvents } from "@/actions/events";
import { InsightsView } from "@/components/insights-view";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const events = await getAllEvents(500);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">📊 Insights</h1>
        <p className="text-sm text-stone-500">
          Toro&apos;s patterns and trends
        </p>
      </div>
      <InsightsView events={events} />
    </div>
  );
}
