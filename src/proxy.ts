import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth in local development
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Public routes - no auth required
  if (
    pathname === "/login" ||
    pathname === "/onboarding" ||
    pathname === "/landing" ||
    pathname === "/api/push/check" ||
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/health" ||
    pathname.startsWith("/p/")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("__session")?.value;

  // Unauthenticated visitors to the root see the landing page
  if (!session && pathname === "/") {
    return NextResponse.rewrite(new URL("/landing", request.url));
  }

  // Other unauthenticated requests go to the landing page
  if (!session) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|illustrations/|icon-.*\\.png|manifest\\.json|sw\\.js|favicon\\.ico|apple-touch-icon\\.png).*)",
  ],
};
