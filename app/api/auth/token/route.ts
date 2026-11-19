import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TOKEN_TTL_SECONDS = 15 * 60;

type SessionUser = {
  id: string;
  role?: string | null;
  isBlocked?: boolean | null;
};

/**
 * Exchanges a verified Better Auth session for a short-lived JWT that the
 * Express API can verify independently. The role is included for convenience,
 * but the API must re-read the user before authorizing an action.
 */
export async function GET() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to request an API token." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const user = session.user as SessionUser;

  if (user.isBlocked) {
    return NextResponse.json(
      { error: "This account has been blocked." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "JWT_SECRET is not configured on the server." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = await new SignJWT({ role: user.role ?? "customer" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer("wedplan-client")
    .setAudience("wedplan-api")
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json(
    { token, expiresIn: TOKEN_TTL_SECONDS },
    { headers: { "Cache-Control": "no-store" } },
  );
}
