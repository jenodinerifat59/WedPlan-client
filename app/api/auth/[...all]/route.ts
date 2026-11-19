import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

/**
 * The auth instance is created lazily so `next build` can complete without a
 * live database connection.
 */
export async function GET(request: Request) {
  const { GET: handler } = toNextJsHandler(getAuth().handler);
  return handler(request);
}

export async function POST(request: Request) {
  const { POST: handler } = toNextJsHandler(getAuth().handler);
  return handler(request);
}
