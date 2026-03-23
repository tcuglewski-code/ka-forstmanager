import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Einmalige Setup-Route — erstellt Admin-User + Tenant
// Aufruf: GET /api/setup?key=forstmanager-setup-2026
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")

  if (key !== "forstmanager-setup-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Prüfen ob bereits initialisiert
    const existing = await prisma.user.findFirst()
    if (existing) {
      return NextResponse.json({ message: "Bereits initialisiert", ok: true })
    }

    // Admin-User anlegen
    const hashedPw = await bcrypt.hash("Admin2026!", 10)
    const admin = await prisma.user.create({
      data: {
        name: "Administrator",
        email: "admin@koch-aufforstung.de",
        password: hashedPw,
        role: "admin",
      },
    })

    // Tenant anlegen
    await prisma.tenant.create({
      data: {
        name: "Koch Aufforstung GmbH",
        slug: "koch-aufforstung",
        primaryColor: "#2C3A1C",
      },
    })

    // Beispiel-Mitarbeiter
    await prisma.mitarbeiter.create({
      data: {
        vorname: "Max",
        nachname: "Mustermann",
        rolle: "gruppenfuehrer",
        telefon: "0151-12345678",
        status: "aktiv",
      },
    })

    return NextResponse.json({
      ok: true,
      message: "Setup erfolgreich",
      adminEmail: admin.email,
      adminPassword: "Admin2026!",
    })
  } catch (error) {
    console.error("[Setup]", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
