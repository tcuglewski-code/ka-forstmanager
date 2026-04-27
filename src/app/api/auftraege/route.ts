import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth-helpers"
// Sprint AG: E-Mail-Benachrichtigung beim Erstellen eines Auftrags
import { emailService } from "@/lib/email"
import { sendKANotification } from "@/lib/telegram-notify"
import { z } from "zod"

// KC-1: Zod Schema für Auftrags-Validierung
const FlaecheSchema = z.object({
  id: z.string().optional(),
  flaeche_ha: z.string().optional(),
  standort: z.string().optional(),
  forstamt: z.string().optional(),
  revier: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
})

const AuftragCreateSchema = z.object({
  titel: z.string().min(1, "Titel ist ein Pflichtfeld"),
  typ: z.string().min(1, "Typ ist ein Pflichtfeld"),
  waldbesitzer: z.string().min(1, "Waldbesitzer ist ein Pflichtfeld").nullable().optional()
    .refine((val) => val && val.trim().length > 0, { message: "Waldbesitzer ist ein Pflichtfeld" }),
  status: z.string().optional().default("anfrage"),
  beschreibung: z.string().optional().nullable(),
  flaeche_ha: z.union([z.string(), z.number()]).optional().nullable(),
  standort: z.string().optional().nullable(),
  bundesland: z.string().optional().nullable(),
  waldbesitzerEmail: z.string().email().optional().nullable().or(z.literal("")),
  waldbesitzerTelefon: z.string().optional().nullable(),
  lat: z.union([z.string(), z.number()]).optional().nullable(),
  lng: z.union([z.string(), z.number()]).optional().nullable(),
  saisonId: z.string().optional().nullable(),
  gruppeId: z.string().optional().nullable(),
  startDatum: z.string().optional().nullable(),
  endDatum: z.string().optional().nullable(),
  wpProjektId: z.string().optional().nullable(),
  wizardDaten: z.object({
    flaechen: z.array(FlaecheSchema).optional().nullable(),
    treffpunkt: z.string().optional().nullable(),
    flaeche_forstamt: z.string().optional().nullable(),
    flaeche_revier: z.string().optional().nullable(),
    bezugsquelle: z.string().optional().nullable(),
    lieferant: z.string().optional().nullable(),
    baumarten: z.string().optional().nullable(),
    pflanzverband: z.string().optional().nullable(),
    zauntyp: z.string().optional().nullable(),
    zaunlaenge: z.string().optional().nullable(),
    schutztyp: z.array(z.string()).optional().nullable(),
    schutzart: z.string().optional().nullable(),
    anzahlHuellen: z.string().optional().nullable(),
    robinienstab: z.string().optional().nullable(),
    aufwuchsart: z.array(z.string()).optional().nullable(),
    arbeitsmethode: z.string().optional().nullable(),
    turnus: z.string().optional().nullable(),
    bestandstyp: z.string().optional().nullable(),
    pflegeart: z.string().optional().nullable(),
  }).optional().nullable(),
}).refine(
  (data) => {
    // KC-1: Mindestens eine Fläche mit flaeche_ha > 0 erforderlich
    const flaechen = data.wizardDaten?.flaechen
    if (flaechen && flaechen.length > 0) {
      const hasValidFlaeche = flaechen.some(f => f.flaeche_ha && parseFloat(f.flaeche_ha) > 0)
      if (hasValidFlaeche) return true
    }
    // Oder direkt flaeche_ha angegeben
    if (data.flaeche_ha) {
      const ha = typeof data.flaeche_ha === "string" ? parseFloat(data.flaeche_ha) : data.flaeche_ha
      return ha > 0
    }
    return false
  },
  { message: "Mindestens eine Fläche mit gültiger Hektar-Angabe ist erforderlich", path: ["flaeche_ha"] }
)

export async function GET(req: NextRequest) {
  // ⚠️ GET ist auth-geschützt — Aufträge sind interne Dashboard-Daten
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const statusIn = searchParams.get("statusIn") // FM-28: comma-separated list
  const typ = searchParams.get("typ")
  const search = searchParams.get("search")

  // Paginierung (Sprint P)
  const take = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)
  const skip = parseInt(searchParams.get("offset") ?? "0")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (status) where.status = status
  else if (statusIn) where.status = { in: statusIn.split(",") }
  if (typ) where.typ = typ

  // Sprint UX: Schnellsuche
  if (search) {
    where.OR = [
      { titel: { contains: search, mode: "insensitive" } },
      { nummer: { contains: search, mode: "insensitive" } },
      { waldbesitzer: { contains: search, mode: "insensitive" } },
      { standort: { contains: search, mode: "insensitive" } },
    ]
  }

  const [auftraege, total] = await Promise.all([
    prisma.auftrag.findMany({
      where,
      include: {
        saison: { select: { id: true, name: true } },
        gruppe: { select: { id: true, name: true } },
      },
      orderBy: { wpErstelltAm: "desc" },
      take,
      skip,
    }),
    prisma.auftrag.count({ where }),
  ])

  return NextResponse.json(auftraege, {
    headers: { "X-Total-Count": String(total) },
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    // KC-1: Zod-Validierung
    const validation = AuftragCreateSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join("."),
        message: e.message
      }))
      return NextResponse.json({ 
        error: "Validierungsfehler", 
        details: errors,
        message: errors.map(e => e.message).join(", ")
      }, { status: 400 })
    }

    const validatedData = validation.data

    // Sprint Q: Auto-Auftragsnummer generieren falls nicht angegeben
    let auftragNummer = body.nummer?.trim() || null
    if (!auftragNummer) {
      const year = new Date().getFullYear()
      const lastAuftrag = await prisma.auftrag.findFirst({
        where: { nummer: { startsWith: `AU-${year}-` } },
        orderBy: { nummer: "desc" },
        select: { nummer: true },
      })
      let nextNum = 1
      if (lastAuftrag?.nummer) {
        const match = lastAuftrag.nummer.match(/AU-\d{4}-(\d+)/)
        if (match) nextNum = parseInt(match[1], 10) + 1
      }
      auftragNummer = `AU-${year}-${String(nextNum).padStart(4, "0")}`
    }

    // KC-1: Verwende validierte Daten
    const flaeche = validatedData.flaeche_ha 
      ? (typeof validatedData.flaeche_ha === "string" ? parseFloat(validatedData.flaeche_ha) : validatedData.flaeche_ha)
      : null

    const auftrag = await prisma.auftrag.create({
      data: {
        nummer: auftragNummer,
        titel: validatedData.titel,
        typ: validatedData.typ,
        status: validatedData.status ?? "anfrage",
        beschreibung: validatedData.beschreibung ?? null,
        flaeche_ha: flaeche,
        standort: validatedData.standort ?? null,
        bundesland: validatedData.bundesland ?? null,
        waldbesitzer: validatedData.waldbesitzer ?? null,
        waldbesitzerEmail: validatedData.waldbesitzerEmail || null,
        waldbesitzerTelefon: validatedData.waldbesitzerTelefon ?? null,
        // FM-02: GPS-Koordinaten
        lat: validatedData.lat != null && validatedData.lat !== "" ? parseFloat(String(validatedData.lat)) : null,
        lng: validatedData.lng != null && validatedData.lng !== "" ? parseFloat(String(validatedData.lng)) : null,
        // wizardDaten für erweiterte Felder (FM-01, FM-03, FM-05, FM-06)
        wizardDaten: validatedData.wizardDaten ?? null,
        wpProjektId: validatedData.wpProjektId ?? null,
        saisonId: validatedData.saisonId ?? null,
        gruppeId: validatedData.gruppeId ?? null,
        startDatum: validatedData.startDatum ? new Date(validatedData.startDatum) : null,
        endDatum: validatedData.endDatum ? new Date(validatedData.endDatum) : null,
      },
    })
    // Sprint AG: E-Mail-Benachrichtigung — Auftrag erstellt
    emailService.auftragErstellt({
      auftragId: auftrag.id,
      auftragNummer: auftrag.nummer ?? auftrag.id,
      auftragTitel: auftrag.titel,
      waldbesitzerName: auftrag.waldbesitzer ?? undefined,
      waldbesitzerEmail: auftrag.waldbesitzerEmail ?? undefined,
      flaeche_ha: auftrag.flaeche_ha ?? undefined,
      standort: auftrag.standort ?? undefined,
    }).catch((err) => console.error("[Email] auftragErstellt fehlgeschlagen:", err))

    // Telegram-Benachrichtigung (direkt, kein LLM)
    sendKANotification({
      event: 'auftrag_erstellt',
      data: {
        name: auftrag.titel,
        kunde: auftrag.waldbesitzer ?? 'Unbekannt',
        datum: new Date().toLocaleDateString('de-DE'),
      },
    }).catch((err) => console.error("[TG-KA] Notification fehlgeschlagen:", err))

    return NextResponse.json(auftrag, { status: 201 })
  } catch (error) {
    console.error("[Auftraege POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
