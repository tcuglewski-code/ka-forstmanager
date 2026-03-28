import { Session } from "next-auth"

// ============================================================
// PERMISSIONS SYSTEM (Sprint UX)
// ============================================================

export const ALL_PERMISSIONS = {
  "auftraege.view": "Aufträge ansehen",
  "auftraege.create": "Aufträge erstellen",
  "auftraege.edit": "Aufträge bearbeiten",
  "auftraege.delete": "Aufträge löschen",
  "mitarbeiter.view": "Mitarbeiter ansehen",
  "mitarbeiter.edit": "Mitarbeiter bearbeiten",
  "lohn.view": "Lohndaten ansehen",
  "lohn.edit": "Lohndaten bearbeiten",
  "rechnungen.view": "Rechnungen ansehen",
  "rechnungen.create": "Rechnungen erstellen",
  "rechnungen.edit": "Rechnungen bearbeiten",
  "angebote.view": "Angebote ansehen",
  "angebote.create": "Angebote erstellen",
  "lager.view": "Lager ansehen",
  "lager.edit": "Lager bearbeiten",
  "protokolle.view": "Protokolle ansehen",
  "protokolle.create": "Protokolle erstellen",
  "protokolle.edit": "Protokolle bearbeiten",
  "abnahme.view": "Abnahmen ansehen",
  "abnahme.create": "Abnahmen erstellen",
  "fuhrpark.view": "Fuhrpark ansehen",
  "fuhrpark.edit": "Fuhrpark bearbeiten",
  "admin.users": "Benutzerverwaltung",
  "admin.settings": "Systemeinstellungen",
} as const

export type Permission = keyof typeof ALL_PERMISSIONS

// Rollen-Vorlagen mit Standard-Permissions
export const ROLE_TEMPLATES: Record<string, Permission[]> = {
  ka_admin: Object.keys(ALL_PERMISSIONS) as Permission[],
  ka_gruppenführer: [
    "auftraege.view",
    "protokolle.view",
    "protokolle.create",
    "protokolle.edit",
    "abnahme.view",
    "abnahme.create",
    "lager.view",
    "fuhrpark.view",
    "mitarbeiter.view",
  ],
  ka_mitarbeiter: [
    "auftraege.view",
    "protokolle.view",
    "protokolle.create",
    "lager.view",
  ],
  baumschule: ["angebote.view"],
}

// Permission-Gruppen für die UI
export const PERMISSION_GROUPS = {
  auftraege: {
    label: "Aufträge",
    permissions: ["auftraege.view", "auftraege.create", "auftraege.edit", "auftraege.delete"],
  },
  mitarbeiter: {
    label: "Mitarbeiter",
    permissions: ["mitarbeiter.view", "mitarbeiter.edit"],
  },
  lohn: {
    label: "Lohn & Finanzen",
    permissions: ["lohn.view", "lohn.edit"],
  },
  rechnungen: {
    label: "Rechnungen",
    permissions: ["rechnungen.view", "rechnungen.create", "rechnungen.edit"],
  },
  angebote: {
    label: "Angebote",
    permissions: ["angebote.view", "angebote.create"],
  },
  lager: {
    label: "Lager",
    permissions: ["lager.view", "lager.edit"],
  },
  protokolle: {
    label: "Protokolle",
    permissions: ["protokolle.view", "protokolle.create", "protokolle.edit"],
  },
  abnahme: {
    label: "Abnahmen",
    permissions: ["abnahme.view", "abnahme.create"],
  },
  fuhrpark: {
    label: "Fuhrpark",
    permissions: ["fuhrpark.view", "fuhrpark.edit"],
  },
  admin: {
    label: "Administration",
    permissions: ["admin.users", "admin.settings"],
  },
} as const

// ============================================================
// ROLLEN-HELPERS
// ============================================================

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

export function isBaumschule(session: Session | null): boolean {
  return hasRole(session, "baumschule")
}

export function hatBaumschuleZugriff(
  session: Session | null,
  baumschuleId: string
): boolean {
  if (isAdmin(session)) return true
  if (!isBaumschule(session)) return false
  const sessionUser = session?.user as { baumschuleId?: string }
  return sessionUser.baumschuleId === baumschuleId
}

// ============================================================
// PERMISSION CHECKS
// ============================================================

export function hasPermission(
  session: Session | null,
  permission: Permission
): boolean {
  if (!session?.user) return false
  
  const userRole = (session.user as { role?: string }).role
  
  // Admins haben immer alle Rechte
  if (userRole === "ka_admin" || userRole === "admin") return true
  
  // Prüfe individuelle Permissions
  const userPermissions = (session.user as { permissions?: string[] }).permissions ?? []
  if (userPermissions.includes(permission)) return true
  
  // Fallback auf Rollen-Templates
  const rolePermissions = ROLE_TEMPLATES[userRole ?? ""] ?? []
  return rolePermissions.includes(permission)
}

export function hasAnyPermission(
  session: Session | null,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(session, p))
}

export function hasAllPermissions(
  session: Session | null,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(session, p))
}
