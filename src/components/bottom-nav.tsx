"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "@/actions/auth";

const PRIMARY_NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/log", label: "Log", icon: "➕" },
  { href: "/insights", label: "Insights", icon: "📊" },
  { href: "/history", label: "History", icon: "📋" },
] as const;

const MORE_NAV = [
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
  { href: "/tricks", label: "Tricks", icon: "🎓" },
  { href: "/reminders", label: "Reminders", icon: "🔔" },
  { href: "/records", label: "Records", icon: "🗂️" },
  { href: "/medications", label: "Medications", icon: "💊" },
  { href: "/socialization", label: "Socialization", icon: "🌍" },
  { href: "/milestones", label: "Milestones", icon: "📸" },
  { href: "/profile", label: "Profile", icon: "🐶" },
] as const;

const ALL_MORE_HREFS = MORE_NAV.map((i) => i.href);

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [, startTransition] = useTransition();
  const isMoreActive = ALL_MORE_HREFS.includes(pathname as typeof ALL_MORE_HREFS[number]);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-20 left-0 right-0 mx-auto max-w-lg px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-2 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(44,36,32,0.12), 0 2px 8px rgba(44,36,32,0.06)",
              }}
            >
              <div className="grid grid-cols-3 gap-1">
                {MORE_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-accent-light"
                          : "hover:bg-[#f5ede3]"
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className={`text-[11px] font-semibold ${
                        isActive ? "text-accent" : "text-[#8b7b6b]"
                      }`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="border-t border-[#e8e0d6] mt-1.5 pt-1.5">
                <button
                  onClick={() => {
                    setShowMore(false);
                    startTransition(() => signOut());
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    text-red-400 hover:bg-red-50 w-full transition-colors"
                >
                  <span className="text-sm">👋</span>
                  <span className="text-xs font-semibold">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 safe-bottom z-50"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--nav-border)",
        }}
      >
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all relative"
              >
                {isActive && (
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
                <span className={`text-xl transition-transform ${isActive ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-bold tracking-wide ${
                  isActive ? "text-accent" : "text-[#a89585]"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all relative"
          >
            {(isMoreActive || showMore) && (
              <span
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            )}
            <span className={`text-xl transition-transform ${isMoreActive || showMore ? "scale-110" : ""}`}>
              •••
            </span>
            <span className={`text-[10px] font-bold tracking-wide ${
              isMoreActive || showMore ? "text-accent" : "text-[#a89585]"
            }`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
