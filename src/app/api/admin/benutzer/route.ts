import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/permissions"
import bcrypt from "bcryptjs"

// GET /api/admin/benutzer — Alle User abrufen (nur Admin)
export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        avatar: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Benutzer laden fehlgeschlagen:", error)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}

// POST /api/admin/benutzer — Neuen User erstellen
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, email, role, password, permissions = [], active = true } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, E-Mail und Passwort erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob E-Mail schon existiert
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 400 })
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "ka_mitarbeiter",
        permissions,
        active,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        permissions: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Benutzer erstellen fehlgeschlagen:", error)
    return NextResponse.json({ error: "Erstellen fehlgeschlagen" }, { status: 500 })
  }
}

// PUT /api/admin/benutzer — User aktualisieren
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, name, email, role, permissions, active, password } = body

    if (!id) {
      return NextResponse.json({ error: "User-ID erforderlich" }, { status: 400 })
    }

    // Prüfe ob User existiert
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 })
    }

    // Falls E-Mail geändert wird, prüfe Uniqueness
    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } })
      if (emailExists) {
        return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 400 })
      }
    }

    // Update-Daten zusammenstellen
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (permissions !== undefined) updateData.permissions = permissions
    if (active !== undefined) updateData.active = active

    // Falls neues Passwort gesetzt
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Benutzer aktualisieren fehlgeschlagen:", error)
    return NextResponse.json({ error: "Aktualisieren fehlgeschlagen" }, { status: 500 })
  }
}

// DELETE /api/admin/benutzer — User löschen
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User-ID erforderlich" }, { status: 400 })
    }

    // Verhindere Selbst-Löschung
    if (id === session?.user?.id) {
      return NextResponse.json(
        { error: "Sie können sich nicht selbst löschen" },
        { status: 400 }
      )
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Benutzer löschen fehlgeschlagen:", error)
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 })
  }
}
