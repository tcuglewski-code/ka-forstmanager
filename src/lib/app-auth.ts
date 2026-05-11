import { verifyAppToken } from "./app-jwt"
import { prisma } from "./prisma"
import { NextResponse } from "next/server"

// AAF-SEC-1/2/3: In-memory cache for app-user status checks (TTL 60s)
const userCache = new Map<
  string,
  { active: boolean; tokenVersion: number; mustChangePassword: boolean; expiresAt: number }
>()
const CACHE_TTL_MS = 60_000

const PASSWORD_CHANGE_ALLOWLIST = [
  "/api/auth/change-password",
  "/api/auth/logout",
  "/api/auth/refresh",
]

async function fetchUserStatus(userId: string) {
  const cached = userCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { active: true, tokenVersion: true, mustChangePassword: true },
  })
  if (!dbUser) {
    userCache.delete(userId)
    return null
  }
  const entry = {
    active: dbUser.active,
    tokenVersion: dbUser.tokenVersion,
    mustChangePassword: dbUser.mustChangePassword,
    expiresAt: Date.now() + CACHE_TTL_MS,
  }
  userCache.set(userId, entry)
  return entry
}

function isPathAllowedDuringPasswordChange(url: string): boolean {
  try {
    const u = new URL(url)
    return PASSWORD_CHANGE_ALLOWLIST.some((p) => u.pathname.startsWith(p))
  } catch {
    return false
  }
}

/**
 * Get the authenticated app user (Bearer token).
 *
 * Enforces:
 *  - SEC-1: tokenVersion in JWT must match DB (revoked when password changes)
 *  - SEC-2: user.active must be true
 *  - SEC-3: when mustChangePassword=true, only allowlisted endpoints are allowed
 *
 * Returns null if any check fails. For SEC-3-aware routes that need to
 * distinguish "no auth" from "password change required", use getAppAuth().
 */
export async function getAppUser(req: Request) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const payload = await verifyAppToken(auth.slice(7))
    if (typeof payload.sub !== "string") return null

    const status = await fetchUserStatus(payload.sub)
    if (!status) return null
    if (!status.active) return null
    if (typeof payload.tv === "number" && payload.tv !== status.tokenVersion) return null

    if (status.mustChangePassword && !isPathAllowedDuringPasswordChange(req.url)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export type AppAuthResult =
  | { type: "ok"; user: Record<string, unknown> }
  | { type: "unauthorized" }
  | { type: "password_change_required" }

/**
 * SEC-3-aware variant of getAppUser. Distinguishes between "no auth" (401)
 * and "password change required" (403 with requiresPasswordChange=true).
 */
export async function getAppAuth(req: Request): Promise<AppAuthResult> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return { type: "unauthorized" }
  try {
    const payload = await verifyAppToken(auth.slice(7))
    if (typeof payload.sub !== "string") return { type: "unauthorized" }

    const status = await fetchUserStatus(payload.sub)
    if (!status) return { type: "unauthorized" }
    if (!status.active) return { type: "unauthorized" }
    if (typeof payload.tv === "number" && payload.tv !== status.tokenVersion) {
      return { type: "unauthorized" }
    }

    if (status.mustChangePassword && !isPathAllowedDuringPasswordChange(req.url)) {
      return { type: "password_change_required" }
    }

    return { type: "ok", user: payload as Record<string, unknown> }
  } catch {
    return { type: "unauthorized" }
  }
}

/**
 * Build a NextResponse from an AppAuthResult that is not "ok".
 * Returns null when result is "ok" so the caller can proceed.
 */
export function appAuthErrorResponse(result: AppAuthResult): NextResponse | null {
  if (result.type === "ok") return null
  if (result.type === "password_change_required") {
    return NextResponse.json(
      { error: "Password change required", requiresPasswordChange: true },
      { status: 403 }
    )
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
