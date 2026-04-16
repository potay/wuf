import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Illustration area */}
      <div className="flex-1 flex flex-col items-center justify-end px-8 pt-16 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/toro-waving.png"
          alt="Welcome"
          className="w-44 h-44 object-contain"
        />
      </div>

      {/* Dark card with branding + login */}
      <div
        className="rounded-t-[40px] px-8 pt-8"
        style={{ background: "var(--hero)", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 2rem)" }}
      >
        <div className="max-w-xs mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-[2.5rem] text-white">Wuf</h1>
            <p className="text-[14px] text-white/50 mt-1">Your puppy tracker</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
