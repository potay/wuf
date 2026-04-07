import { getAllEvents } from "@/actions/events";
import { HistoryList } from "@/components/history-list";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const events = await getAllEvents(200);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">📋 History</h1>
        <p className="text-sm text-stone-500">All of Toro&apos;s logged events</p>
      </div>
      <HistoryList initialEvents={events} />
    </div>
  );
}
