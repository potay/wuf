import { getAllMedicalRecords } from "@/actions/medical-records";
import { MedicalRecordsView } from "@/components/medical-records-view";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const [records, user] = await Promise.all([getAllMedicalRecords(), getCurrentUser()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🗂️ Medical records</h1>
        <p className="text-sm text-stone-500">
          Vet records, vaccinations, and lab results
        </p>
      </div>
      <MedicalRecordsView records={records} canWrite={user.canWrite} />
    </div>
  );
}
