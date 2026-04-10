import type { NextAuthConfig } from "next-auth"

// Edge-safe auth config (kein Prisma — für Middleware nutzbar)
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.baumschuleId = user.baumschuleId ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
        session.user.baumschuleId = token.baumschuleId ?? null
      }
      return session
    },
  },
  providers: [], // Providers werden in auth.ts hinzugefügt (brauchen Prisma)
} satisfies NextAuthConfig
