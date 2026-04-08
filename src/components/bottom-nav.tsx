"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  { href: "/medications", label: "Medications", icon: "💊" },
  { href: "/socialization", label: "Socialization", icon: "🌍" },
  { href: "/milestones", label: "Milestones", icon: "📸" },
  { href: "/profile", label: "Profile", icon: "🐶" },
] as const;

const ALL_MORE_HREFS = MORE_NAV.map((i) => i.href);

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = ALL_MORE_HREFS.includes(pathname as typeof ALL_MORE_HREFS[number]);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-20 left-0 right-0 mx-auto max-w-lg px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-2">
              {MORE_NAV.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-amber-50 text-amber-700"
                        : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-200 safe-bottom z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive
                    ? "text-amber-600 font-semibold"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              isMoreActive || showMore
                ? "text-amber-600 font-semibold"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <span className="text-xl">•••</span>
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
