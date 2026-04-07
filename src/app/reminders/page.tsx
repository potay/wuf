import { getAllReminders } from "@/actions/reminders";
import { RemindersList } from "@/components/reminders-list";
import { ReminderForm } from "@/components/reminder-form";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const reminders = await getAllReminders();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🔔 Reminders</h1>
        <p className="text-sm text-stone-500">
          Vaccinations, vet visits, and more
        </p>
      </div>
      <ReminderForm />
      <RemindersList reminders={reminders} />
    </div>
  );
}
