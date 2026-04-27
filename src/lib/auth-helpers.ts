import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { jwtVerify } from "jose"

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

    // Try JWT verification first (mobile app tokens)
    if (process.env.NEXTAUTH_SECRET) {
      try {
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
        const { payload } = await jwtVerify(token, secret)
        if (payload.sub) {
          return {
            id: payload.sub,
            email: payload.email as string,
            name: payload.name as string,
            role: payload.role as string,
          }
        }
      } catch {
        // Not a valid JWT — fall through to DB API token lookup
      }
    }

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

const ADMIN_ROLES = ["admin", "ka_admin", "administrator"]

/**
 * Check if user has admin role
 */
export function isAdmin(user: { role?: string } | null): boolean {
  return user?.role === "admin"
}

/**
 * Check if user has any admin role variant
 */
export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role)
}

/**
 * Get Gruppen-IDs the user has access to based on their role.
 * Returns empty array for admins (= no restriction).
 * Returns ['__none__'] if user not found (= no access).
 */
export async function getGruppenIdsForUser(
  userEmail: string | undefined | null,
  userRole: string | undefined | null
): Promise<string[]> {
  if (!userRole || isAdminRole(userRole)) return [] // admins: no restriction

  if (!userEmail) return ["__none__"]

  const own = await prisma.mitarbeiter.findFirst({
    where: { email: userEmail, deletedAt: null },
    select: { id: true },
  })
  if (!own) return ["__none__"]

  if (userRole === "ka_gruppenführer" || userRole === "ka_gruppenfuhrer") {
    const gruppen = await prisma.gruppe.findMany({
      where: { gruppenfuehrerId: own.id },
      select: { id: true },
    })
    return gruppen.map((g) => g.id)
  }

  // MA or other roles: via GruppeMitglied
  const mitgliedschaften = await prisma.gruppeMitglied.findMany({
    where: { mitarbeiterId: own.id },
    select: { gruppeId: true },
  })
  return mitgliedschaften.map((m) => m.gruppeId)
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
