import { getAllTricks } from "@/actions/tricks";
import { TricksView } from "@/components/tricks-view";

export const dynamic = "force-dynamic";

export default async function TricksPage() {
  const tricks = await getAllTricks();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🎓 Tricks</h1>
        <p className="text-sm text-stone-500">
          Commands and tricks Toro is learning
        </p>
      </div>
      <TricksView tricks={tricks} />
    </div>
  );
}
