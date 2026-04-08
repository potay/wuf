import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">🐶 Toro&apos;s profile</h1>
        <p className="text-sm text-stone-500">
          Emergency info, vet contacts, and details
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
