import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/features/auth/lib/auth.config";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// NOTE: Next.js 16 - proxy.ts runs on Node.js runtime by default.
// The `runtime` export config is no longer supported here.

const { auth } = NextAuth(authConfig);

let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "10 s"),
    analytics: true,
  });
}

export const proxy = auth(async (req) => {
  try {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Rate Limiting for all /api routes (except webhooks)
    if (
      ratelimit &&
      pathname.startsWith("/api") &&
      !pathname.startsWith("/api/payments/webhook")
    ) {
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      // Identify user by auth ID if logged in, otherwise IP
      const identifier = req.auth?.user?.id || ip;
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }
    }

    // Protect all /admin routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Check for admin role
      if (req.auth?.user?.role !== "admin") {
        if (pathname.startsWith("/api")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  } catch (error) {
    // If proxy logic fails (e.g. rate limiter unreachable), allow the request through
    console.warn("[proxy] Error in proxy handler, passing through:", (error as Error).message);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg (app icon)
     * - images/ (public images)
     * - login (auth pages)
     * - api/upload (file upload - bypasses proxy for streaming)
     * - api/chat (chat streaming - bypasses proxy for long-lived connections)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images/|login|api/upload|api/chat(?:/|$)).*)",
  ],
};
