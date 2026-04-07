"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/log", label: "Log", icon: "➕" },
  { href: "/history", label: "History", icon: "📋" },
  { href: "/reminders", label: "Reminders", icon: "🔔" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-200 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
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
      </div>
    </nav>
  );
}
