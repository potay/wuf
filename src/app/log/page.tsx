import { LogForm } from "@/components/log-form";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">➕ Log event</h1>
        <p className="text-sm text-stone-500">
          Log an event with details for {user.puppyName}
        </p>
      </div>
      <LogForm />
    </div>
  );
}
