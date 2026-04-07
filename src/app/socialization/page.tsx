import { getAllSocializationItems } from "@/actions/socialization";
import { SocializationView } from "@/components/socialization-view";

export const dynamic = "force-dynamic";

export default async function SocializationPage() {
  const items = await getAllSocializationItems();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🌍 Socialization</h1>
        <p className="text-sm text-stone-500">
          Expose Toro to new experiences during the critical window
        </p>
      </div>
      <SocializationView items={items} />
    </div>
  );
}
