import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST /api/auth/change-password
// Supports both session auth (web) and Bearer token (app)
export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const body = await req.json()
    // Support both field names for backwards compatibility
    const currentPassword = body.currentPassword || body.oldPassword
    const { newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Aktuelles und neues Passwort erforderlich" },
        { status: 400 }
      )
    }

    // AAF-SEC-3: Password strength validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Neues Passwort muss mindestens 8 Zeichen haben" },
        { status: 400 }
      )
    }
    if (!/\d/.test(newPassword)) {
      return NextResponse.json(
        { error: "Neues Passwort muss mindestens eine Zahl enthalten" },
        { status: 400 }
      )
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Neues Passwort muss mindestens ein Sonderzeichen enthalten" },
        { status: 400 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id as string },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 })
    }

    const validOldPassword = await bcrypt.compare(currentPassword, dbUser.password)
    if (!validOldPassword) {
      return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // AAF-SEC-3: Reset mustChangePassword + increment tokenVersion (invalidates other sessions)
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        tokenVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Passwort ändern fehlgeschlagen:", error)
    return NextResponse.json({ error: "Passwort ändern fehlgeschlagen" }, { status: 500 })
  }
}
