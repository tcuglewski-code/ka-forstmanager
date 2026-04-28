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

  // Load dynamic onboarding steps from DB
  const schritte = await prisma.saisonOnboardingSchritt.findMany({
    where: { saisonId: id },
    orderBy: { reihenfolge: "asc" },
  })

  const meineAbschluesse = await prisma.saisonOnboardingAbschluss.findMany({
    where: { mitarbeiterId, schritt: { saisonId: id } },
  })

  // If no dynamic steps exist, fall back to legacy hardcoded steps
  if (schritte.length === 0) {
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
        { key: "anmelden", label: "Saison-Anmeldung", pflicht: true, beschreibung: "Bestätige deine Teilnahme für diese Saison", status: abgeschlossen ? "genehmigt" : "ausstehend" },
        { key: "kontaktdaten", label: "Kontaktdaten prüfen", pflicht: true, beschreibung: "Prüfe und aktualisiere deine Kontaktdaten", status: abgeschlossen ? "genehmigt" : "ausstehend" },
        { key: "ausruestung", label: "Ausrüstung bestätigen", pflicht: false, beschreibung: "Bestätige dass du die nötige Ausrüstung hast", status: abgeschlossen ? "genehmigt" : "ausstehend" },
        { key: "sicherheit", label: "Sicherheitsunterweisung", pflicht: true, beschreibung: "Lies und bestätige die Sicherheitsvorschriften", status: abgeschlossen ? "genehmigt" : "ausstehend" },
      ],
    })
  }

  // Dynamic steps from DB
  const allPflichtDone = schritte
    .filter((s) => s.pflicht)
    .every((s) => meineAbschluesse.find((a) => a.schrittId === s.id && a.status === "genehmigt"))

  return NextResponse.json({
    saisonId: id,
    saisonName: saison.name,
    abgeschlossen: allPflichtDone,
    schritte: schritte.map((s) => {
      const abschluss = meineAbschluesse.find((a) => a.schrittId === s.id)
      return {
        id: s.id,
        key: s.id,
        label: s.titel,
        typ: s.typ,
        pflicht: s.pflicht,
        beschreibung: s.beschreibung,
        dokumentVorlageUrl: s.dokumentVorlageUrl,
        formularFelder: s.formularFelder,
        status: abschluss?.status ?? "ausstehend",
        eingereichtAm: abschluss?.eingereichtAm,
      }
    }),
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

  const body = await req.json()

  // If schrittId provided, submit specific step
  if (body.schrittId) {
    const abschluss = await prisma.saisonOnboardingAbschluss.upsert({
      where: { schrittId_mitarbeiterId: { schrittId: body.schrittId, mitarbeiterId } },
      update: {
        status: "eingereicht",
        antwortDaten: body.antwortDaten ?? null,
        eingereichtAm: new Date(),
      },
      create: {
        schrittId: body.schrittId,
        mitarbeiterId,
        status: "eingereicht",
        antwortDaten: body.antwortDaten ?? null,
        eingereichtAm: new Date(),
      },
    })
    return NextResponse.json(abschluss)
  }

  // Legacy: mark entire onboarding as done
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
