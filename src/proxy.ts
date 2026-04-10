import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth in local development
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Allow login page, static assets, service worker, and push check (Cloud Scheduler)
  if (pathname === "/login" || pathname === "/api/push/check") {
    return NextResponse.next();
  }

  const session = request.cookies.get("__session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon-.*\\.png|manifest\\.json|sw\\.js|favicon\\.ico).*)",
  ],
};
