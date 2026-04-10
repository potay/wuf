import { getAllTricks } from "@/actions/tricks";
import { TricksView } from "@/components/tricks-view";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TricksPage() {
  const [tricks, user] = await Promise.all([getAllTricks(), getCurrentUser()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🎓 Tricks</h1>
        <p className="text-sm text-stone-500">
          Commands and tricks {user.puppyName} is learning
        </p>
      </div>
      <TricksView tricks={tricks} />
    </div>
  );
}
