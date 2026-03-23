import type { NextAuthConfig } from "next-auth"

// Edge-safe auth config (kein Prisma — für Middleware nutzbar)
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  providers: [], // Providers werden in auth.ts hinzugefügt (brauchen Prisma)
} satisfies NextAuthConfig
