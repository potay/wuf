import { getAllMilestones } from "@/actions/milestones";
import { MilestonesView } from "@/components/milestones-view";

export const dynamic = "force-dynamic";

export default async function MilestonesPage() {
  const milestones = await getAllMilestones();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">📸 Milestones</h1>
        <p className="text-sm text-stone-500">
          Toro&apos;s memorable moments
        </p>
      </div>
      <MilestonesView milestones={milestones} />
    </div>
  );
}
