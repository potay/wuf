import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #faf6f1 0%, #f0e6d8 50%, #e8ddd0 100%)" }}
    >
      <div className="w-full max-w-sm text-center space-y-10">
        <div className="space-y-4">
          <div
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl"
            style={{
              background: "linear-gradient(135deg, #e8913a, #d17e2e)",
              boxShadow: "0 8px 24px rgba(232,145,58,0.35)",
            }}
          >
            🐾
          </div>
          <div>
            <h1
              className="text-4xl font-black tracking-tight"
              style={{ color: "#2c2420" }}
            >
              Wuf
            </h1>
            <p className="text-sm mt-1" style={{ color: "#a89585" }}>
              Toro&apos;s puppy tracker
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
