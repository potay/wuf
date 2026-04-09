import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-3xl font-bold text-stone-800">Wuf</h1>
          <p className="text-sm text-stone-500 mt-1">Toro&apos;s puppy tracker</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
