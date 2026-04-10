import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Illustration area - light background so the PNG blends */}
      <div className="flex-1 flex flex-col items-center justify-end px-8 pt-20 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/toro-waving.png"
          alt="Toro waving"
          className="w-52 h-52 object-contain"
        />
      </div>

      {/* Dark card with branding + login */}
      <div
        className="rounded-t-[40px] px-8 pt-10 pb-12"
        style={{ background: "var(--hero)" }}
      >
        <div className="max-w-xs mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-[2.5rem] text-white">Wuf</h1>
            <p className="text-[14px] text-white/50 mt-1">Toro&apos;s puppy tracker</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
