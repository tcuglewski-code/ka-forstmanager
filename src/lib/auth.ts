import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

// Re-export helpers from auth-helpers.ts to avoid breaking existing imports
export { verifyToken, isAdmin, isAccountant, canAccessAccounting } from "@/lib/auth-helpers"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Base fields from auth.config.ts
      if (user) {
        token.id = user.id
        token.role = user.role
        token.baumschuleId = user.baumschuleId ?? null
      }
      // AAF-SEC-1/2/3: Load tokenVersion + mustChangePassword into JWT
      if (token.sub && (trigger === "signIn" || token.tv === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { tokenVersion: true, mustChangePassword: true },
        })
        if (dbUser) {
          token.tv = dbUser.tokenVersion
          token.mustChangePassword = dbUser.mustChangePassword
        }
      }
      return token
    },
    session: authConfig.callbacks!.session!,
  },
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

        // Baumschule-ID laden falls Rolle = baumschule
        let baumschuleId: string | null = null
        if (user.role === "baumschule") {
          const baumschule = await prisma.baumschule.findFirst({
            where: { userId: user.id },
            select: { id: true },
          })
          baumschuleId = baumschule?.id ?? null
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role, baumschuleId }
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
        
        // Baumschule-ID laden falls Rolle = baumschule
        let baumschuleId: string | null = null
        if (user.role === "baumschule") {
          const baumschule = await prisma.baumschule.findFirst({
            where: { userId: user.id },
            select: { id: true },
          })
          baumschuleId = baumschule?.id ?? null
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role, baumschuleId }
      },
    }),
  ],
})
