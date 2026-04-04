import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { NextRequest } from "next/server"

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Standard Login mit Passwort
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Passwort", type: "password" },
        twoFactorValidated: { label: "2FA Validated", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.active) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        
        // Sprint Q015: 2FA Check
        // Wenn 2FA aktiviert ist, muss twoFactorValidated gesetzt sein
        // (wird vom Login-Flow nach erfolgreicher 2FA-Validierung gesetzt)
        if (user.twoFactorEnabled && credentials.twoFactorValidated !== "true") {
          // 2FA erforderlich aber nicht validiert → ablehnen
          return null
        }
        
        // Letzten Login aktualisieren
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })
        
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
    // Magic-Link Login für Waldbesitzer (Kunden)
    Credentials({
      id: "magic-link",
      credentials: {
        authCode: { label: "Auth Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.authCode) return null
        
        // Auth-Code Token suchen
        const magicToken = await prisma.magicToken.findUnique({
          where: { token: `auth_${credentials.authCode}` },
        })
        
        if (!magicToken || magicToken.used) return null
        if (new Date() > magicToken.expiresAt) return null
        
        // User laden
        const user = await prisma.user.findUnique({
          where: { email: magicToken.email },
        })
        
        if (!user || !user.active) return null
        
        // Token als verwendet markieren
        await prisma.magicToken.update({
          where: { id: magicToken.id },
          data: { used: true },
        })
        
        // Letzten Login aktualisieren
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })
        
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
})
