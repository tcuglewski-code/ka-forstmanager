import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ALLOWED_ORIGINS = new Set([
  "https://peru-otter-113714.hostingersite.com",
  "https://kochaufforstung.de",
  "https://www.kochaufforstung.de",
])

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://peru-otter-113714.hostingersite.com"
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(req.headers.get("origin")),
  })
}

// POST: öffentliche Bestellanfrage (vom WP-Wizard) — kein Auth
// Body: { baumart, menge?, flaecheHa?, bundesland?, kontaktName, kontaktEmail,
//         kontaktTelefon?, pflanzenArten?, notizen?, quelle? }
export const POST = withErrorHandler(async (req: Request) => {
  const cors = corsHeadersFor(req.headers.get("origin"))
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  // Rate-Limit: 10 Anfragen pro IP pro Stunde (in-memory; bestätigter Spam-Verdacht
  // sollte zusätzlich über Honeypot-Feld unten gefiltert werden).
  if (!checkRateLimit(`bs-bestellung:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429, headers: cors }
    )
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400, headers: cors })
  }

  // Honeypot: Bots füllen oft alle Felder aus — `website` ist im echten Formular
  // nicht vorhanden, also muss es leer bleiben.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    // Wie 201 antworten, um Bots nicht zu informieren, aber nichts speichern.
    return NextResponse.json({ id: "spam", status: "neu", createdAt: new Date().toISOString() }, { status: 201, headers: cors })
  }

  const baumart = typeof body.baumart === "string" ? body.baumart.trim() : ""
  const kontaktName = typeof body.kontaktName === "string" ? body.kontaktName.trim() : ""
  const kontaktEmail = typeof body.kontaktEmail === "string" ? body.kontaktEmail.trim() : ""

  if (!baumart || baumart.length > 100) {
    return NextResponse.json(
      { error: "Baumart ist Pflicht und max. 100 Zeichen lang" },
      { status: 400, headers: cors }
    )
  }
  if (!kontaktName || kontaktName.length > 200) {
    return NextResponse.json({ error: "Kontaktname ist Pflicht" }, { status: 400, headers: cors })
  }
  if (!kontaktEmail || !EMAIL_REGEX.test(kontaktEmail) || kontaktEmail.length > 200) {
    return NextResponse.json({ error: "Gültige E-Mail erforderlich" }, { status: 400, headers: cors })
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

  // BS-MKT-01 Phase 2: optional direkter Lieferant-Wunsch aus Wizard
  let preselectedBaumschuleId: string | null = null
  let initialStatus = "neu"
  if (typeof body.baumschuleId === "string" && body.baumschuleId.trim()) {
    const bs = await prisma.baumschule.findFirst({
      where: { id: body.baumschuleId, status: "aktiv", aktiv: true },
      select: { id: true },
    })
    if (bs) {
      preselectedBaumschuleId = bs.id
      initialStatus = "zugewiesen"
    }
  }

  const created = await prisma.baumschulBestellung.create({
    data: {
      baumschuleId: preselectedBaumschuleId,
      baumart: baumart.slice(0, 100),
      menge,
      status: initialStatus,
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

  // BS-MKT-01 Phase-1-Fix: Bestätigungsmail an Anfrager (Best-Effort)
  void sendEmail({
    to: kontaktEmail,
    subject: "Ihre Pflanzenanfrage bei Koch Aufforstung",
    html: `
      <p>Sehr geehrte/r ${escapeHtml(kontaktName)},</p>
      <p>vielen Dank für Ihre Anfrage. Wir haben Ihre Pflanzenbestellung erfolgreich erhalten:</p>
      <ul>
        <li><strong>Baumart:</strong> ${escapeHtml(baumart.slice(0, 100))}</li>
        ${menge > 0 ? `<li><strong>Menge:</strong> ${menge} Stück</li>` : ""}
        ${flaecheHa ? `<li><strong>Fläche:</strong> ${flaecheHa} ha</li>` : ""}
        ${bundesland ? `<li><strong>Bundesland:</strong> ${escapeHtml(bundesland)}</li>` : ""}
      </ul>
      <p>Wir prüfen Ihre Anfrage und melden uns innerhalb von <strong>48 Stunden</strong> mit einem unverbindlichen Angebot bei Ihnen.</p>
      <p>Mit freundlichen Grüßen<br>Ihr Team der Koch Aufforstung GmbH</p>
      <p style="font-size:11px;color:#888;margin-top:24px;">
        Diese Bestätigung wurde automatisch generiert. Anfrage-Nummer: ${created.id}
      </p>
    `,
  }).catch((e) => console.warn("[BaumschulBestellung] Bestätigungsmail fehlgeschlagen:", e))

  return NextResponse.json(created, { status: 201, headers: cors })
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

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
