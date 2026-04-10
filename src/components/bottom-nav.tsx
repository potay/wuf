"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "@/actions/auth";

const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights" },
] as const;

const MORE_NAV = [
  { href: "/log", label: "Log" },
  { href: "/schedule", label: "Schedule" },
  { href: "/weight", label: "Weight" },
  { href: "/tricks", label: "Tricks" },
  { href: "/reminders", label: "Reminders" },
  { href: "/records", label: "Records" },
  { href: "/medications", label: "Meds" },
  { href: "/socialization", label: "Social" },
  { href: "/milestones", label: "Milestones" },
  { href: "/profile", label: "Profile" },
] as const;

const ALL_MORE_HREFS = MORE_NAV.map((i) => i.href);

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [, startTransition] = useTransition();
  const isMoreActive = ALL_MORE_HREFS.includes(pathname as typeof ALL_MORE_HREFS[number]);

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-24 left-0 right-0 mx-auto max-w-lg px-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl p-3" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="grid grid-cols-4 gap-1">
                {MORE_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className={`text-center py-3 px-1 rounded-2xl text-[12px] font-bold transition-colors ${
                        isActive
                          ? "bg-[var(--hero)] text-white"
                          : "text-[var(--fg-2)] hover:bg-[var(--bg)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="border-t border-[var(--border)] mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowMore(false);
                    startTransition(() => signOut());
                  }}
                  className="w-full text-center py-2.5 rounded-2xl text-[12px] font-bold
                    text-red-500 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50 px-5 pb-2">
        <div
          className="max-w-lg mx-auto rounded-2xl px-2 py-2 flex justify-around items-center"
          style={{ background: "var(--hero)", boxShadow: "var(--shadow-lg)" }}
        >
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
              isMoreActive || showMore
                ? "bg-white/20 text-white"
                : "text-white/50"
            }`}
          >
            More
          </button>
        </div>
      </nav>
    </>
  );
}
