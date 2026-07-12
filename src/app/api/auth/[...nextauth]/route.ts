import { handlers } from "@/features/auth/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Valid Auth.js v5 action paths under /api/auth/
const VALID_AUTH_ACTIONS = new Set([
  "signin",
  "signout",
  "callback",
  "session",
  "csrf",
  "providers",
  "error",
]);

function isValidAuthRequest(req: NextRequest): boolean {
  const url = new URL(req.url);
  // Extract the action segment: /api/auth/<action>/...
  const segments = url.pathname.split("/").filter(Boolean);
  // segments = ["api", "auth", "<action>", ...]
  const action = segments[2];
  return !!action && VALID_AUTH_ACTIONS.has(action);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  if (!isValidAuthRequest(req)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  if (!isValidAuthRequest(req)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return handlers.POST(req);
}
