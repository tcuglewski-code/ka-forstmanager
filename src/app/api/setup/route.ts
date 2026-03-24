import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// ⚠️  EINMALIGE SETUP-ROUTE — NUR FÜR ERSTINSTALLATION!
//
// Diese Route erstellt den ersten Admin-User und den Tenant.
// Sie ist über einen URL-Key gesichert, aber NICHT durch Session-Auth.
//
// SICHERHEITSHINWEIS:
//   → Nach dem ersten erfolgreichen Setup diese Route deaktivieren oder löschen!
//   → Dafür SETUP_DISABLED=true in .env.local setzen oder die Datei umbenennen.
//   → In Produktionsumgebungen darf diese Route NICHT dauerhaft aktiv sein.
//
// Aufruf: GET /api/setup?key=forstmanager-setup-2026
// Der Key sollte in der Produktion durch eine zufällige Zeichenkette ersetzt werden.

export async function GET(req: Request) {
  // ⛔ Deaktivierungs-Schalter: SETUP_DISABLED=true in .env setzt diese Route außer Betrieb
  if (process.env.SETUP_DISABLED === "true") {
    return NextResponse.json(
      { error: "Setup ist deaktiviert. Die Anwendung ist bereits konfiguriert." },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")

  if (key !== "forstmanager-setup-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Prüfen ob bereits initialisiert — verhindert Überschreiben
    const existing = await prisma.user.findFirst()
    if (existing) {
      return NextResponse.json({
        message: "Bereits initialisiert. Setup nicht erneut ausführbar.",
        ok: true,
        hinweis: "Setze SETUP_DISABLED=true in .env um diese Route dauerhaft zu sperren.",
      })
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
      message: "Setup erfolgreich abgeschlossen.",
      adminEmail: admin.email,
      adminPassword: "Admin2026!",
      naechsterSchritt: "Bitte sofort das Passwort ändern und SETUP_DISABLED=true in .env setzen!",
    })
  } catch (error) {
    console.error("[Setup]", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
