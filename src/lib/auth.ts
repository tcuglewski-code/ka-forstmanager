import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

// Re-export helpers from auth-helpers.ts to avoid breaking existing imports
export { verifyToken, isAdmin, isAccountant, canAccessAccounting } from "@/lib/auth-helpers"

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
