import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
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
  ],
})
