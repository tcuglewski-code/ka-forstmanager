// Sprint AJ: Login-Link Generator für Baumschulen
// Generiert einen zeitlich begrenzten Magic-Link-Token für eine Baumschule

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { withErrorHandler } from "@/lib/api-handler"


export const POST = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Nur Admins dürfen Login-Links generieren" }, { status: 403 })

  const { id: baumschuleId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    include: { user: true },
  })

  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  // Zufälligen Token generieren (64 Zeichen, URL-sicher)
  const token = crypto.randomBytes(32).toString("hex")
  // Token läuft nach 72 Stunden ab
  const tokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000)

  // User-Account erstellen oder aktualisieren
  let userId = baumschule.userId

  if (!userId) {
    // Neuen Baumschul-User erstellen
    const email = baumschule.email ?? `baumschule-${baumschuleId}@ka-intern.local`
    const randomPasswort = crypto.randomBytes(16).toString("hex")
    const hashedPasswort = await bcrypt.hash(randomPasswort, 10)

    const user = await prisma.user.create({
      data: {
        name: baumschule.name,
        email,
        password: hashedPasswort,
        role: "baumschule", // Sprint AJ: Neue Rolle
        active: true,
      },
    })
    userId = user.id
  }

  // Token in Baumschule speichern
  await prisma.baumschule.update({
    where: { id: baumschuleId },
    data: {
      loginToken: token,
      loginTokenExpiry: tokenExpiry,
      userId,
    },
  })

  // Login-Link zusammensetzen
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://ka-forstmanager.vercel.app"
  const loginLink = `${baseUrl}/baumschule/login?token=${token}`

  return NextResponse.json({
    loginLink,
    token,
    gueltigBis: tokenExpiry.toISOString(),
    baumschuleName: baumschule.name,
    message: `Login-Link für ${baumschule.name} generiert. Gültig bis ${tokenExpiry.toLocaleDateString("de-DE")}`,
  })
})
