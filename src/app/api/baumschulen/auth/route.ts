// Sprint AJ: Token-basierter Login für Baumschulen
// Validiert den Magic-Link-Token. FIX 8: Verlängert die Gültigkeit beim Verifizieren,
// damit derselbe Token als "Portal-Session-Token" weiter genutzt werden kann
// (URL: /baumschule/portal?token=xxx). Kein NextAuth nötig.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/api-handler"

// Sliding-Window: Bei jedem erfolgreichen Verify den Token um 30 Tage verlängern
const TOKEN_SLIDING_DAYS = 30

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: "Token fehlt" }, { status: 400 })
  }

  // Token prüfen
  const baumschule = await prisma.baumschule.findUnique({
    where: { loginToken: token },
    include: { user: true },
  })

  if (!baumschule) {
    return NextResponse.json({ error: "Ungültiger Login-Link" }, { status: 401 })
  }

  if (!baumschule.loginTokenExpiry || baumschule.loginTokenExpiry < new Date()) {
    return NextResponse.json({ error: "Login-Link abgelaufen. Bitte neuen Link anfordern." }, { status: 401 })
  }

  // FIX 8: Token NICHT mehr einmalig — verlängere stattdessen die Gültigkeit
  // (sliding window) damit der gleiche Token als Portal-Session-Token nutzbar bleibt.
  const newExpiry = new Date(Date.now() + TOKEN_SLIDING_DAYS * 24 * 60 * 60 * 1000)
  await prisma.baumschule.update({
    where: { id: baumschule.id },
    data: { loginTokenExpiry: newExpiry },
  })

  return NextResponse.json({
    erfolg: true,
    baumschule: {
      id: baumschule.id,
      name: baumschule.name,
    },
    user: baumschule.user ? {
      id: baumschule.user.id,
      email: baumschule.user.email,
      role: baumschule.user.role,
    } : null,
  })
})
