import { getCurrentUser } from "@/lib/session";
import { IllustrationEditor } from "@/components/illustration-editor";
import { UpgradeBanner } from "@/components/upgrade-banner";

export const dynamic = "force-dynamic";

export default async function IllustrationPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🎨 Customize illustration</h1>
        <p className="text-sm text-stone-500">
          Make {user.puppyName}&apos;s illustration look just like them
        </p>
      </div>
      {user.canWrite ? (
        <IllustrationEditor
          currentUrl={user.profile.illustrationUrl ?? null}
          breed={user.profile.breed || ""}
          puppyName={user.puppyName}
        />
      ) : (
        <>
          <UpgradeBanner
            canWrite={user.canWrite}
            subscriptionStatus={user.subscriptionStatus}
            trialDaysLeft={user.trialDaysLeft}
            isOwner={user.isOwner}
          />
          {user.profile.illustrationUrl && (
            <div className="wuf-card p-6 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.profile.illustrationUrl}
                alt={user.puppyName}
                className="w-48 h-48 object-contain"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
