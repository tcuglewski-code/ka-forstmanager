import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const mitarbeiterId = (appUser as { mitarbeiterId?: string }).mitarbeiterId

  if (!mitarbeiterId) {
    return NextResponse.json({ error: "Kein Mitarbeiter-Profil" }, { status: 403 })
  }

  const saison = await prisma.saison.findUnique({ where: { id } })
  if (!saison) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // SaisonAnmeldung prüfen — status "onboarding_done" = abgeschlossen
  const anmeldung = await prisma.saisonAnmeldung.findUnique({
    where: { saisonId_mitarbeiterId: { saisonId: id, mitarbeiterId } },
  })

  const abgeschlossen = anmeldung?.status === "onboarding_done"

  return NextResponse.json({
    saisonId: id,
    saisonName: saison.name,
    abgeschlossen,
    abgeschlossenAm: abgeschlossen && anmeldung?.createdAt ? anmeldung.createdAt : null,
    schritte: [
      {
        key: "anmelden",
        label: "Saison-Anmeldung",
        pflicht: true,
        beschreibung: "Bestätige deine Teilnahme für diese Saison",
      },
      {
        key: "kontaktdaten",
        label: "Kontaktdaten prüfen",
        pflicht: true,
        beschreibung: "Prüfe und aktualisiere deine Kontaktdaten",
      },
      {
        key: "ausruestung",
        label: "Ausrüstung bestätigen",
        pflicht: false,
        beschreibung: "Bestätige dass du die nötige Ausrüstung hast",
      },
      {
        key: "sicherheit",
        label: "Sicherheitsunterweisung",
        pflicht: true,
        beschreibung: "Lies und bestätige die Sicherheitsvorschriften",
      },
    ],
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const mitarbeiterId = (appUser as { mitarbeiterId?: string }).mitarbeiterId

  if (!mitarbeiterId) {
    return NextResponse.json({ error: "Kein Mitarbeiter-Profil" }, { status: 403 })
  }

  // Onboarding als abgeschlossen markieren via SaisonAnmeldung status
  await prisma.saisonAnmeldung.upsert({
    where: { saisonId_mitarbeiterId: { saisonId: id, mitarbeiterId } },
    update: { status: "onboarding_done" },
    create: {
      saisonId: id,
      mitarbeiterId,
      status: "onboarding_done",
    },
  })

  return NextResponse.json({ success: true })
}
