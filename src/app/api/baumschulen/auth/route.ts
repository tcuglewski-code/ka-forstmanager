// Sprint AJ: Token-basierter Login für Baumschulen
// Validiert den Magic-Link-Token und gibt Session-Daten zurück

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"

export async function POST(req: Request) {
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

  if (!baumschule.user) {
    return NextResponse.json({ error: "Kein User-Account verknüpft" }, { status: 500 })
  }

  // Token einmalig nutzen — nach Login ungültig machen
  await prisma.baumschule.update({
    where: { id: baumschule.id },
    data: { loginToken: null, loginTokenExpiry: null },
  })

  return NextResponse.json({
    erfolg: true,
    baumschule: {
      id: baumschule.id,
      name: baumschule.name,
    },
    user: {
      id: baumschule.user.id,
      email: baumschule.user.email,
      role: baumschule.user.role,
    },
  })
}
