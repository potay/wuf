import { getCurrentUser } from "@/lib/session";
import { BillingView } from "@/components/billing-view";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getCurrentUser();
  // trialDaysLeft computed server-side in getCurrentUser()
  const trialEndsFormatted = user.trialEndsAt > 0
    ? format(new Date(user.trialEndsAt), "MMM d, yyyy")
    : "N/A";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">💳 Billing</h1>
        <p className="text-sm text-stone-500">
          Manage your subscription
        </p>
      </div>
      <BillingView
        canWrite={user.canWrite}
        subscriptionStatus={user.subscriptionStatus}
        trialDaysLeft={user.trialDaysLeft}
        trialEndsAtFormatted={trialEndsFormatted}
        isOwner={user.isOwner}
        puppyName={user.puppyName}
      />
    </div>
  );
}
