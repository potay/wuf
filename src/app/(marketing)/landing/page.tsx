import Link from "next/link";

const FEATURES = [
  {
    emoji: "⚡",
    title: "One-tap logging",
    description: "Log pee, poop, meals, crate time, walks, and more with a single tap. Time offset for when you forget.",
  },
  {
    emoji: "🏠",
    title: "Crate training timer",
    description: "Live timer with color-coded urgency. Push notifications at 1hr and 2hr so you never leave them too long.",
  },
  {
    emoji: "📊",
    title: "Smart insights",
    description: "Discover your puppy's patterns: how long after water until they pee, meal-to-poop timing, hourly trends.",
  },
  {
    emoji: "⚖️",
    title: "Growth projection",
    description: "Track weight over time with a growth chart that predicts adult weight using breed data and parent weights.",
  },
  {
    emoji: "🎓",
    title: "Training tracker",
    description: "Track tricks from learning to mastered. Socialization checklist with 60+ experiences across 7 categories.",
  },
  {
    emoji: "🗂️",
    title: "Medical records",
    description: "Upload vet PDFs and our AI extracts vaccines, medications, and follow-up reminders automatically.",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Sign up in seconds",
    description: "One tap with Google. Enter your puppy's name and breed.",
  },
  {
    num: "2",
    title: "Start tracking",
    description: "Log events with one tap. The app learns your puppy's patterns over time.",
  },
  {
    num: "3",
    title: "Share the journey",
    description: "Invite family members with a code. Share a public profile with friends.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="text-xl font-extrabold" style={{ color: "var(--fg)" }}>
          🐾 Wuf
        </div>
        <Link
          href="/login"
          className="px-5 py-2 rounded-xl text-[14px] font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          Get started
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1
              className="text-[2.75rem] md:text-[3.5rem] leading-[1.1] font-extrabold"
              style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}
            >
              Your puppy&apos;s
              <br />
              <span style={{ color: "var(--accent)" }}>entire world</span>
              <br />
              in one app.
            </h1>
            <p className="text-lg mt-5 leading-relaxed" style={{ color: "var(--fg-2)" }}>
              Track potty breaks, crate training, meals, weight, vet records,
              tricks, and milestones. Wuf turns puppy chaos into clear patterns
              and smart predictions.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <Link
                href="/login"
                className="px-8 py-4 rounded-2xl text-[16px] font-bold text-white shadow-lg"
                style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(196,114,58,0.3)" }}
              >
                Start tracking free
              </Link>
              <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                No credit card needed
              </span>
            </div>
          </div>

          {/* Hero illustration - phone mockup */}
          <div className="relative flex justify-center">
            <div
              className="w-[280px] rounded-[36px] p-3 shadow-2xl"
              style={{ background: "var(--hero)" }}
            >
              <div className="rounded-[28px] overflow-hidden" style={{ background: "var(--bg)" }}>
                {/* Fake status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] font-semibold" style={{ color: "var(--fg-3)" }}>
                  <span>9:41</span>
                  <span>⚡ 100%</span>
                </div>
                {/* Fake hero header */}
                <div className="px-4 py-4 rounded-b-[24px]" style={{ background: "var(--hero)" }}>
                  <div className="flex items-end gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/illustrations/toro-happy.png" alt="Puppy" className="w-14 h-14 object-contain" />
                    <div>
                      <p className="text-[8px] text-white/40">Good day!</p>
                      <p className="text-[13px] text-white font-bold">Toro&apos;s Dashboard</p>
                    </div>
                  </div>
                </div>
                {/* Fake status cards */}
                <div className="px-3 pt-3 space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {["💧", "💩", "🍖", "💦"].map((emoji, i) => (
                      <div key={i} className="bg-white rounded-xl p-2 text-center shadow-sm">
                        <div className="text-sm">{emoji}</div>
                        <div className="text-[10px] font-bold" style={{ color: i === 1 ? "var(--urgent)" : "var(--ok)" }}>
                          {["2h", "5h", "1h", "45m"][i]}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Fake quick log */}
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="text-[9px] font-bold mb-2" style={{ color: "var(--fg-3)" }}>QUICK LOG</p>
                    <div className="grid grid-cols-4 gap-2">
                      {["💧 Pee", "💩 Poop", "🍖 Meal", "💦 Water"].map((item, i) => (
                        <div key={i} className="text-center">
                          <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-sm" style={{ background: ["#FEF9C3", "#FDEBC8", "#FFEDD5", "#DBEAFE"][i] }}>
                            {item.split(" ")[0]}
                          </div>
                          <span className="text-[7px]" style={{ color: "var(--fg-2)" }}>{item.split(" ")[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Fake nav */}
                <div className="px-3 py-2 mt-2">
                  <div className="flex justify-around rounded-xl py-1.5 text-[8px] font-bold" style={{ background: "var(--hero)" }}>
                    <span className="px-2 py-1 rounded-lg bg-white/20 text-white">Home</span>
                    <span className="text-white/40 px-2 py-1">History</span>
                    <span className="text-white/40 px-2 py-1">Insights</span>
                    <span className="text-white/40 px-2 py-1">More</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div
              className="absolute -right-4 top-16 bg-white rounded-2xl px-4 py-3 shadow-lg text-center"
              style={{ transform: "rotate(3deg)" }}
            >
              <div className="text-2xl">⚖️</div>
              <div className="text-[11px] font-bold" style={{ color: "var(--fg)" }}>Growth</div>
              <div className="text-[10px]" style={{ color: "var(--fg-3)" }}>Projection</div>
            </div>
            <div
              className="absolute -left-4 bottom-24 bg-white rounded-2xl px-4 py-3 shadow-lg text-center"
              style={{ transform: "rotate(-3deg)" }}
            >
              <div className="text-2xl">🎓</div>
              <div className="text-[11px] font-bold" style={{ color: "var(--fg)" }}>12 tricks</div>
              <div className="text-[10px]" style={{ color: "var(--fg-3)" }}>mastered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="py-8 border-y" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-center">
          <div>
            <div className="text-2xl font-extrabold" style={{ color: "var(--fg)" }}>Free</div>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>forever</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
          <div>
            <div className="text-2xl font-extrabold" style={{ color: "var(--fg)" }}>60+</div>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>socialization items</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
          <div>
            <div className="text-2xl font-extrabold" style={{ color: "var(--fg)" }}>18</div>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>event types</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
          <div>
            <div className="text-2xl font-extrabold" style={{ color: "var(--fg)" }}>AI</div>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>vet record parsing</div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
            Everything your puppy needs.
            <br />
            <span style={{ color: "var(--accent)" }}>Nothing they don&apos;t.</span>
          </h2>
          <p className="text-base mt-3 max-w-lg mx-auto" style={{ color: "var(--fg-2)" }}>
            Built by puppy parents who were tired of spreadsheets, forgotten vet records,
            and guessing when the next potty break should be.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-white rounded-3xl p-6 shadow-sm">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: "var(--accent-light)" }}
              >
                {feature.emoji}
              </div>
              <h3 className="text-[17px] font-bold mb-2" style={{ color: "var(--fg)" }}>
                {feature.title}
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 rounded-[40px] mx-4" style={{ background: "var(--hero)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-14" style={{ letterSpacing: "-0.03em" }}>
            Up and running in 60 seconds
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-4"
                  style={{ background: "rgba(255,255,255,0.1)", color: "var(--accent)" }}
                >
                  {step.num}
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2">{step.title}</h3>
                <p className="text-[14px] text-white/60 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Share section */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold mb-4" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
              Share the puppy love
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--fg-2)" }}>
              Every puppy gets a shareable profile page. Show off milestones, training
              progress, and growth to friends and family. Invite your partner or dog
              sitter with a simple code to track together.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-lg">👥</span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>Multi-user access</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-lg">📤</span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>Public profiles</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/toro-waving.png"
              alt="Share your puppy's journey"
              className="w-48 h-48 object-contain"
            />
          </div>
        </div>
      </section>

      {/* Illustration personalization */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm text-center">
          <div className="flex justify-center gap-4 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/toro-happy.png" alt="" className="w-20 h-20 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/toro-curious.png" alt="" className="w-20 h-20 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/toro-sleeping.png" alt="" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3" style={{ color: "var(--fg)" }}>
            Your puppy, illustrated
          </h2>
          <p className="text-[15px] max-w-md mx-auto mb-6" style={{ color: "var(--fg-2)" }}>
            Wuf generates a custom cartoon illustration of your puppy using AI,
            matching their breed and markings. Iterate until it looks just like them.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-2xl text-[14px] font-bold"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            Create your puppy&apos;s illustration
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
          Your puppy deserves better
          <br />
          than a notes app.
        </h2>
        <p className="text-base mb-8 max-w-md mx-auto" style={{ color: "var(--fg-2)" }}>
          Join puppy parents who track smarter, not harder.
          Free forever. Set up in 60 seconds.
        </p>
        <Link
          href="/login"
          className="inline-block px-10 py-4 rounded-2xl text-[17px] font-bold text-white shadow-xl"
          style={{ background: "var(--accent)", boxShadow: "0 8px 30px rgba(196,114,58,0.35)" }}
        >
          Start tracking free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-[12px]" style={{ color: "var(--fg-3)" }}>
          <span>🐾 Wuf — Your puppy&apos;s tracker</span>
          <span>Made with love for puppies everywhere</span>
        </div>
      </footer>
    </div>
  );
}
