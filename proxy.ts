import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic, cookie-only checks. The dashboard layout and the API client do
 * the real authorization work; this file only avoids rendering private shells
 * for visitors who clearly have no session cookie.
 */
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

const AUTH_ROUTES = ["/sign-in", "/sign-up"] as const;

function mockModeIsOn() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

export function proxy(request: NextRequest) {
  // Fixture mode has no session cookie, so skip the optimistic redirects and
  // let the client-side guard explain what is happening.
  if (mockModeIsOn()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  if (
    hasSession &&
    AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number])
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
