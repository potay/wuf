import { getAllMedications } from "@/actions/medications";
import { MedicationsView } from "@/components/medications-view";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MedicationsPage() {
  const [medications, user] = await Promise.all([getAllMedications(), getCurrentUser()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">💊 Medications</h1>
        <p className="text-sm text-stone-500">
          Track {user.puppyName}&apos;s medications and supplements
        </p>
      </div>
      <MedicationsView medications={medications} />
    </div>
  );
}
