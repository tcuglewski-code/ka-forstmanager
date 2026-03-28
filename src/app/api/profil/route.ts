import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/profil — Aktuellen User-Profil abrufen
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        notifyMaengel: true,
        notifyAuftraege: true,
        notifyAbnahmen: true,
        lastLoginAt: true,
        permissions: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profil laden fehlgeschlagen:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

// PUT /api/profil — Profil aktualisieren
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, avatar, notifyMaengel, notifyAuftraege, notifyAbnahmen } = body

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(notifyMaengel !== undefined && { notifyMaengel }),
        ...(notifyAuftraege !== undefined && { notifyAuftraege }),
        ...(notifyAbnahmen !== undefined && { notifyAbnahmen }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        notifyMaengel: true,
        notifyAuftraege: true,
        notifyAbnahmen: true,
        lastLoginAt: true,
        permissions: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Profil speichern fehlgeschlagen:", error)
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 })
  }
}
