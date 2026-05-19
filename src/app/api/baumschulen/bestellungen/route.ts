import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"
import { checkRateLimit } from "@/lib/rate-limit"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST: öffentliche Bestellanfrage (vom WP-Wizard) — kein Auth
// Body: { baumart, menge?, flaecheHa?, bundesland?, kontaktName, kontaktEmail,
//         kontaktTelefon?, pflanzenArten?, notizen?, quelle? }
export const POST = withErrorHandler(async (req: Request) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  // Rate-Limit: 10 Anfragen pro IP pro Stunde (in-memory, reicht für Vercel/single-region)
  if (!checkRateLimit(`bs-bestellung:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429 }
    )
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 })
  }

  const baumart = typeof body.baumart === "string" ? body.baumart.trim() : ""
  const kontaktName = typeof body.kontaktName === "string" ? body.kontaktName.trim() : ""
  const kontaktEmail = typeof body.kontaktEmail === "string" ? body.kontaktEmail.trim() : ""

  if (!baumart || baumart.length > 100) {
    return NextResponse.json(
      { error: "Baumart ist Pflicht und max. 100 Zeichen lang" },
      { status: 400 }
    )
  }
  if (!kontaktName || kontaktName.length > 200) {
    return NextResponse.json({ error: "Kontaktname ist Pflicht" }, { status: 400 })
  }
  if (!kontaktEmail || !EMAIL_REGEX.test(kontaktEmail) || kontaktEmail.length > 200) {
    return NextResponse.json({ error: "Gültige E-Mail erforderlich" }, { status: 400 })
  }

  const kontaktTelefon =
    typeof body.kontaktTelefon === "string" ? body.kontaktTelefon.trim().slice(0, 50) : null
  const bundesland =
    typeof body.bundesland === "string" ? body.bundesland.trim().slice(0, 100) : null
  const notizen =
    typeof body.notizen === "string" ? body.notizen.trim().slice(0, 2000) : null
  const quelle =
    typeof body.quelle === "string" && body.quelle.trim()
      ? body.quelle.trim().slice(0, 50)
      : "website-wizard"

  const flaecheHaRaw = body.flaecheHa
  let flaecheHa: number | null = null
  if (typeof flaecheHaRaw === "number" && Number.isFinite(flaecheHaRaw) && flaecheHaRaw >= 0) {
    flaecheHa = flaecheHaRaw
  } else if (typeof flaecheHaRaw === "string") {
    const n = parseFloat(flaecheHaRaw.replace(",", "."))
    if (Number.isFinite(n) && n >= 0) flaecheHa = n
  }

  const mengeRaw = body.menge
  let menge = 0
  if (typeof mengeRaw === "number" && Number.isFinite(mengeRaw) && mengeRaw >= 0) {
    menge = Math.floor(mengeRaw)
  } else if (typeof mengeRaw === "string") {
    const n = parseInt(mengeRaw, 10)
    if (Number.isFinite(n) && n >= 0) menge = n
  }

  // pflanzenArten als JSON erlauben (Array oder Objekt)
  const pflanzenArten =
    body.pflanzenArten && (Array.isArray(body.pflanzenArten) || typeof body.pflanzenArten === "object")
      ? (body.pflanzenArten as object)
      : null

  const created = await prisma.baumschulBestellung.create({
    data: {
      baumschuleId: null,
      baumart: baumart.slice(0, 100),
      menge,
      status: "neu",
      kontaktName: kontaktName.slice(0, 200),
      kontaktEmail: kontaktEmail.slice(0, 200),
      kontaktTelefon,
      flaecheHa,
      bundesland,
      pflanzenArten: pflanzenArten ?? undefined,
      notizen,
      quelle,
    },
    select: { id: true, status: true, createdAt: true },
  })

  return NextResponse.json(created, { status: 201 })
})

// GET: Liste aller Bestellanfragen (Admin)
// Optional Query: ?status=neu&baumart=Eiche&from=ISO&to=ISO
export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const role = session.user.role
  if (role !== "ka_admin" && role !== "supervisor") {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get("status")
  const baumart = url.searchParams.get("baumart")
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (baumart) where.baumart = { contains: baumart, mode: "insensitive" }
  if (from || to) {
    const range: Record<string, Date> = {}
    if (from) {
      const d = new Date(from)
      if (!isNaN(d.getTime())) range.gte = d
    }
    if (to) {
      const d = new Date(to)
      if (!isNaN(d.getTime())) range.lte = d
    }
    if (Object.keys(range).length > 0) where.createdAt = range
  }

  const bestellungen = await prisma.baumschulBestellung.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      baumschule: { select: { id: true, name: true, ort: true, bundesland: true } },
    },
    take: 500,
  })

  return NextResponse.json({ bestellungen })
})
