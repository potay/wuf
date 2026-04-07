import { getEventsByType } from "@/actions/events";
import { WeightView } from "@/components/weight-view";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const weightEvents = await getEventsByType("weight", 200);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">⚖️ Weight</h1>
        <p className="text-sm text-stone-500">
          Track Toro&apos;s growth over time
        </p>
      </div>
      <WeightView events={weightEvents} />
    </div>
  );
}
