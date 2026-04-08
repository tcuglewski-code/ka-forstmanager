import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

// Lazy import to avoid circular dependency with NextAuth initialization
const getAuth = async () => {
  const { auth } = await import("@/lib/auth")
  return auth
}

/**
 * Verify token from Authorization header or session
 * Returns user object or null
 */
export async function verifyToken(req: NextRequest) {
  // Try Bearer token first
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    // For API tokens, look up in database
    const apiToken = await prisma.apiToken?.findUnique?.({
      where: { token },
      include: { user: true }
    }).catch(() => null)

    if (apiToken?.user && apiToken.expiresAt > new Date()) {
      return apiToken.user
    }
  }

  // Fall back to session auth
  const auth = await getAuth()
  const session = await auth()
  if (session?.user) {
    return session.user
  }

  return null
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: { role?: string } | null): boolean {
  return user?.role === "admin"
}

/**
 * Check if user has accountant role (Steuerberater)
 * Accountants have read-only access to invoices and time entries
 */
export function isAccountant(user: { role?: string } | null): boolean {
  return user?.role === "accountant"
}

/**
 * Check if user can access accounting data (admin or accountant)
 */
export function canAccessAccounting(user: { role?: string } | null): boolean {
  return isAdmin(user) || isAccountant(user) || user?.role === "ka_admin"
}
