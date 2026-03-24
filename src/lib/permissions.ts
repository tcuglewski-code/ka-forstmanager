import { Session } from "next-auth"

export type UserRole = "ka_admin" | "ka_gruppenführer" | "ka_mitarbeiter" | string

export function hasRole(session: Session | null, ...roles: UserRole[]): boolean {
  if (!session?.user) return false
  const userRole = (session.user as { role?: string }).role ?? ""
  return roles.includes(userRole as UserRole)
}

export function isAdmin(session: Session | null): boolean {
  return hasRole(session, "ka_admin", "admin")
}

export function isAdminOrGF(session: Session | null): boolean {
  return hasRole(session, "ka_admin", "admin", "ka_gruppenführer", "gruppenführer")
}
