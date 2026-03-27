import { Session } from "next-auth"

// Sprint AJ: Rolle "baumschule" hinzugefügt
export type UserRole = "ka_admin" | "ka_gruppenführer" | "ka_mitarbeiter" | "baumschule" | "kunde" | string

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

// Sprint AJ: Prüft ob der User eine Baumschule ist
export function isBaumschule(session: Session | null): boolean {
  return hasRole(session, "baumschule")
}

// Sprint AJ: Prüft ob der User seine eigene Baumschule-ID besitzt
export function hatBaumschuleZugriff(
  session: Session | null,
  baumschuleId: string
): boolean {
  if (isAdmin(session)) return true // Admins sehen alles
  if (!isBaumschule(session)) return false
  const sessionUser = session?.user as { baumschuleId?: string }
  return sessionUser.baumschuleId === baumschuleId
}
