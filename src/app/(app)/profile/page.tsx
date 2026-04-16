import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, user] = await Promise.all([getProfile(), getCurrentUser()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🐶 {user.puppyName}&apos;s profile</h1>
        <p className="text-sm text-stone-500">
          Emergency info, vet contacts, and details
        </p>
      </div>

      {/* Invite code */}
      {user.inviteCode && (
        <div className="wuf-card p-4">
          <div className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide mb-2">
            Invite code
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[24px] font-bold tracking-[0.2em] text-[var(--fg)]">
              {user.inviteCode}
            </span>
            <span className="text-[12px] text-[var(--fg-3)]">
              Share to add family members
            </span>
          </div>
        </div>
      )}

      <ProfileForm profile={profile} canWrite={user.canWrite} />
    </div>
  );
}
