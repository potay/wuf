import Link from "next/link";
import { db } from "@/db";
import { Timestamp } from "firebase-admin/firestore";
import { format, differenceInWeeks } from "date-fns";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PublicPuppyPage({ params }: PageProps) {
  const { code } = await params;

  // Look up puppy by invite code (no auth required)
  const snapshot = await db.collection("puppies")
    .where("inviteCode", "==", code.toUpperCase())
    .limit(1)
    .get();

  if (snapshot.empty) {
    notFound();
  }

  const puppyDoc = snapshot.docs[0];
  const puppy = puppyDoc.data();
  const puppyId = puppyDoc.id;
  const puppyName = puppy.name || "Puppy";

  // Fetch stats
  const eventsCol = db.collection("puppies").doc(puppyId);
  const [
    tricksSnap,
    socializationSnap,
    milestonesSnap,
    weightSnap,
  ] = await Promise.all([
    eventsCol.collection("tricks").get(),
    eventsCol.collection("socializations").where("completedAt", "!=", null).get(),
    eventsCol.collection("milestones").orderBy("occurredAt", "desc").limit(5).get(),
    eventsCol.collection("events").where("type", "==", "weight").orderBy("occurredAt", "desc").limit(1).get(),
  ]);

  const tricks = tricksSnap.docs.map(d => d.data());
  const masteredTricks = tricks.filter(t => t.status === "mastered").length;
  const learningTricks = tricks.filter(t => t.status === "learning").length;
  const learnedTricks = tricks.filter(t => t.status === "learned").length;
  const socializationComplete = socializationSnap.size;

  const milestones = milestonesSnap.docs.map(d => ({
    title: d.data().title,
    date: (d.data().occurredAt as Timestamp).toDate(),
    media: d.data().media?.[0]?.url || null,
  }));

  let currentWeight: string | null = null;
  if (!weightSnap.empty) {
    try {
      const meta = JSON.parse(weightSnap.docs[0].data().metadata || "{}");
      if (meta.weight) currentWeight = `${meta.weight} ${meta.unit || "lbs"}`;
    } catch { /* ignore */ }
  }

  // Calculate age
  let ageText: string | null = null;
  if (puppy.birthday) {
    const birthday = new Date(puppy.birthday + "T00:00:00");
    const weeks = differenceInWeeks(new Date(), birthday);
    if (weeks < 12) ageText = `${weeks} weeks old`;
    else ageText = `${Math.round(weeks / 4.3)} months old`;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <div
        className="px-6 pt-16 pb-10 text-center rounded-b-[40px]"
        style={{ background: "var(--hero)", color: "white" }}
      >
        {puppy.illustrationUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={puppy.illustrationUrl}
            alt={puppyName}
            className="w-32 h-32 object-contain mx-auto mb-4"
          />
        )}
        <h1 className="text-3xl font-extrabold">{puppyName}</h1>
        {puppy.breed && (
          <p className="text-white/60 text-sm mt-1">{puppy.breed}</p>
        )}
        {ageText && (
          <p className="text-white/40 text-sm mt-0.5">{ageText}</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="max-w-lg mx-auto px-5 -mt-5 space-y-4 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {currentWeight && (
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">⚖️</div>
              <div className="text-lg font-bold text-stone-800">{currentWeight}</div>
              <div className="text-[10px] text-stone-400 uppercase font-semibold">Current</div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">🎓</div>
            <div className="text-lg font-bold text-stone-800">{masteredTricks}</div>
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Mastered</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">🌍</div>
            <div className="text-lg font-bold text-stone-800">{socializationComplete}</div>
            <div className="text-[10px] text-stone-400 uppercase font-semibold">Socialized</div>
          </div>
        </div>

        {/* Tricks breakdown */}
        {tricks.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-stone-700 mb-3">Tricks</h2>
            <div className="flex items-center gap-3 text-[12px]">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-stone-500">Progress</span>
                  <span className="font-bold text-stone-700">
                    {masteredTricks + learnedTricks + learningTricks} total
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden flex">
                  {masteredTricks > 0 && (
                    <div
                      className="h-full bg-green-400"
                      style={{ width: `${(masteredTricks / tricks.length) * 100}%` }}
                    />
                  )}
                  {learnedTricks > 0 && (
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${(learnedTricks / tricks.length) * 100}%` }}
                    />
                  )}
                  {learningTricks > 0 && (
                    <div
                      className="h-full bg-amber-300"
                      style={{ width: `${(learningTricks / tricks.length) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-stone-400">
                  <span>⭐ {masteredTricks} mastered</span>
                  <span>✅ {learnedTricks} learned</span>
                  <span>📖 {learningTricks} learning</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent milestones */}
        {milestones.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-stone-700 mb-3">Recent milestones</h2>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  {m.media ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.media} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-sm">
                      ⭐
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-stone-700">{m.title}</div>
                    <div className="text-[11px] text-stone-400">{format(m.date, "MMM d, yyyy")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-4 space-y-3">
          <p className="text-[13px] text-stone-500">
            Track your puppy&apos;s journey with Wuf
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-2xl text-[15px] font-bold text-white"
            style={{ background: "var(--hero)" }}
          >
            Try Wuf for free
          </Link>
          <p className="text-[11px] text-stone-400">
            Activity tracking, health records, growth projection, and more
          </p>
        </div>
      </div>
    </div>
  );
}
