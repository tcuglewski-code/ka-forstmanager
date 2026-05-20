/**
 * Analytics Utilities
 * Shared helpers for the /api/analytics/* endpoints + /analytics dashboard.
 */

import { auth } from "@/lib/auth"

export type AnalyticsRange = "3m" | "6m" | "12m" | "all"

/** Returns the start Date for a given range, or null for "all". */
export function rangeToStart(range: AnalyticsRange): Date | null {
  if (range === "all") return null
  const months = range === "3m" ? 3 : range === "6m" ? 6 : 12
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Parses range from URLSearchParams with safe default. */
export function parseRange(searchParams: URLSearchParams): AnalyticsRange {
  const r = searchParams.get("range") as AnalyticsRange | null
  if (r === "3m" || r === "6m" || r === "12m" || r === "all") return r
  return "12m"
}

/** Verifies session and required role (ka_admin / super_admin). */
export async function requireAnalyticsRole() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !["ka_admin", "super_admin", "admin"].includes(role || "")) {
    return null
  }
  return session
}

/** "YYYY-MM" key from a Date (UTC). */
export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

/** Build sequence of last N month-keys, oldest first. */
export function lastMonths(n: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    keys.push(monthKey(d))
  }
  return keys
}
