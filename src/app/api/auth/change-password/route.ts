import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST /api/auth/change-password
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Altes und neues Passwort erforderlich" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Neues Passwort muss mindestens 8 Zeichen haben" },
        { status: 400 }
      )
    }

    // Aktuellen User laden
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 })
    }

    // Altes Passwort prüfen
    const validOldPassword = await bcrypt.compare(oldPassword, user.password)
    if (!validOldPassword) {
      return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 400 })
    }

    // Neues Passwort hashen
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Passwort aktualisieren
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Passwort ändern fehlgeschlagen:", error)
    return NextResponse.json({ error: "Passwort ändern fehlgeschlagen" }, { status: 500 })
  }
}
