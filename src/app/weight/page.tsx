import { getEventsByType } from "@/actions/events";
import { WeightView } from "@/components/weight-view";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const [weightEvents, user] = await Promise.all([getEventsByType("weight", 200), getCurrentUser()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">⚖️ Weight</h1>
        <p className="text-sm text-stone-500">
          Track {user.puppyName}&apos;s growth over time
        </p>
      </div>
      <WeightView
        events={weightEvents}
        birthday={user.profile.birthday}
        breed={user.profile.breed}
      />
    </div>
  );
}
