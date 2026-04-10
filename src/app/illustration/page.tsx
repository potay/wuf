import { getCurrentUser } from "@/lib/session";
import { IllustrationEditor } from "@/components/illustration-editor";

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
      <IllustrationEditor
        currentUrl={user.profile.illustrationUrl ?? null}
        breed={user.profile.breed || ""}
        puppyName={user.puppyName}
      />
    </div>
  );
}
