import { OnboardingForm } from "@/components/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/toro-waving.png"
            alt="Welcome"
            className="w-32 h-32 object-contain mx-auto mb-4"
          />
          <h1 className="text-[1.75rem] text-[var(--fg)]">Welcome to Wuf!</h1>
          <p className="text-[14px] text-[var(--fg-3)] mt-1">Tell us about your puppy</p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
