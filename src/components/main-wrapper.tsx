"use client";

import { usePathname } from "next/navigation";

const NO_PADDING = ["/login", "/onboarding", "/landing"];

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = NO_PADDING.includes(pathname) || pathname.startsWith("/p/");

  return (
    <main className={`flex-1 scroll-touch ${isPublic ? "" : "pb-20"}`}>
      {children}
    </main>
  );
}
