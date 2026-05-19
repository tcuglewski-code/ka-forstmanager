/**
 * BS-MKT-01 Phase 2: Baumschul-Selbst-Registrierung
 * POST /api/public/baumschulen/registrierung
 *
 * Öffentliches Endpoint (kein Auth) für Baumschulen, die sich für die
 * Koch-Aufforstung-Marketplace bewerben möchten. Neue Anträge bekommen
 * `status: "pending"` und müssen vom Admin freigegeben werden.
 *
 * Sicherheit: Honeypot-Feld + IP-Rate-Limit (3 Anträge pro Stunde pro IP).
 * DSGVO: Datenschutz-Einwilligung wird im Frontend abgefragt und im
 * Notizen-Feld dokumentiert ("Einwilligung Datenschutz: ja / Zeitpunkt").
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"

const ALLOWED_ORIGINS = new Set([
  "https://peru-otter-113714.hostingersite.com",
  "https://kochaufforstung.de",
  "https://www.kochaufforstung.de",
  "https://ka-forstmanager.vercel.app",
])

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "cuglewski@koch-aufforstung.de"

const BUNDESLAENDER = new Set([
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
])

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://peru-otter-113714.hostingersite.com"
  return {
    "Access-Control-Allow-Origin": allow,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeadersFor(req.headers.get("origin")) })
}

type Body = {
  firmenname?: unknown
  ansprechpartner?: unknown
  email?: unknown
  telefon?: unknown
  ort?: unknown
  plz?: unknown
  bundesland?: unknown
  lieferBundeslaender?: unknown
  baumarten?: unknown
  kapazitaet?: unknown
  zufZertifiziert?: unknown
  datenschutzAccepted?: unknown
  // Honeypot
  website?: unknown
}

export async function POST(req: NextRequest) {
  const cors = corsHeadersFor(req.headers.get("origin"))
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  if (!checkRateLimit(`bs-registrierung:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429, headers: cors }
    )
  }

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body) {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400, headers: cors })
  }

  // Honeypot
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json(
      { success: true, id: "spam", status: "pending" },
      { status: 201, headers: cors }
    )
  }

  const firmenname = typeof body.firmenname === "string" ? body.firmenname.trim() : ""
  const ansprechpartner = typeof body.ansprechpartner === "string" ? body.ansprechpartner.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const telefon = typeof body.telefon === "string" ? body.telefon.trim() : ""
  const ort = typeof body.ort === "string" ? body.ort.trim() : ""
  const plz = typeof body.plz === "string" ? body.plz.trim() : ""
  const bundesland = typeof body.bundesland === "string" ? body.bundesland.trim() : ""
  const kapazitaet = typeof body.kapazitaet === "string" ? body.kapazitaet.trim().slice(0, 1000) : ""
  const zufZertifiziert = body.zufZertifiziert === true
  const datenschutzAccepted = body.datenschutzAccepted === true

  if (!firmenname || firmenname.length > 200) {
    return NextResponse.json({ error: "Firmenname ist Pflicht (max 200 Zeichen)" }, { status: 400, headers: cors })
  }
  if (!ansprechpartner || ansprechpartner.length > 200) {
    return NextResponse.json({ error: "Ansprechpartner ist Pflicht" }, { status: 400, headers: cors })
  }
  if (!email || !EMAIL_REGEX.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Gültige E-Mail-Adresse erforderlich" }, { status: 400, headers: cors })
  }
  if (!ort) {
    return NextResponse.json({ error: "Ort ist Pflicht" }, { status: 400, headers: cors })
  }
  if (!bundesland || !BUNDESLAENDER.has(bundesland)) {
    return NextResponse.json({ error: "Gültiges Bundesland erforderlich" }, { status: 400, headers: cors })
  }
  if (!datenschutzAccepted) {
    return NextResponse.json(
      { error: "Bitte stimmen Sie der Datenschutzerklärung zu" },
      { status: 400, headers: cors }
    )
  }

  const lieferBL = Array.isArray(body.lieferBundeslaender)
    ? body.lieferBundeslaender
        .filter((b): b is string => typeof b === "string" && BUNDESLAENDER.has(b))
        .slice(0, 16)
    : []

  const baumarten = Array.isArray(body.baumarten)
    ? body.baumarten
        .filter((b): b is string => typeof b === "string" && b.trim().length > 0)
        .map((b) => b.trim().slice(0, 80))
        .slice(0, 30)
    : []

  // Duplikat-Check: gibt es schon eine Baumschule mit dieser Mail oder diesem Namen?
  const existing = await prisma.baumschule.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { name: { equals: firmenname, mode: "insensitive" } },
      ],
    },
    select: { id: true, status: true, name: true, email: true },
  })

  if (existing) {
    // Wir verraten nicht, ob es Email oder Name war (DSGVO + Sicherheit) —
    // freundliche Meldung mit Hinweis auf Support-Kontakt.
    return NextResponse.json(
      {
        error: "Es liegt bereits eine Bewerbung mit diesem Firmennamen oder dieser E-Mail vor.",
        existingStatus: existing.status,
      },
      { status: 409, headers: cors }
    )
  }

  const jetzt = new Date().toISOString()
  const notizen =
    `[Selbst-Registrierung]\n` +
    `Eingegangen: ${jetzt}\n` +
    `IP: ${ip}\n` +
    `Datenschutz-Einwilligung: ja (${jetzt})\n` +
    (telefon ? `Telefon: ${telefon}\n` : "") +
    (plz ? `PLZ: ${plz}\n` : "") +
    (baumarten.length > 0 ? `Sortiment: ${baumarten.join(", ")}\n` : "") +
    (kapazitaet ? `Kapazität/Hinweise: ${kapazitaet}\n` : "")

  let created
  try {
    created = await prisma.baumschule.create({
      data: {
        name: firmenname,
        ort: `${plz ? plz + " " : ""}${ort}`.trim(),
        bundesland,
        ansprechpartner,
        email,
        telefon: telefon || null,
        aktiv: true,
        status: "pending",
        lieferBundeslaender: lieferBL,
        zufZertifiziert,
        notizen,
      },
      select: { id: true, name: true, status: true },
    })
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Eine Baumschule mit diesem Namen ist bereits registriert." },
        { status: 409, headers: cors }
      )
    }
    console.error("[Registrierung] DB-Fehler:", err)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500, headers: cors })
  }

  // Admin-Notification (Best-Effort, blockiert die Antwort nicht)
  void sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `[Baumschulen] Neue Bewerbung: ${firmenname}`,
    html: `
      <h2>Neue Baumschul-Bewerbung</h2>
      <p><strong>Firma:</strong> ${escapeHtml(firmenname)}</p>
      <p><strong>Ansprechpartner:</strong> ${escapeHtml(ansprechpartner)}</p>
      <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
      ${telefon ? `<p><strong>Telefon:</strong> ${escapeHtml(telefon)}</p>` : ""}
      <p><strong>Sitz:</strong> ${escapeHtml(plz)} ${escapeHtml(ort)} (${escapeHtml(bundesland)})</p>
      ${lieferBL.length > 0 ? `<p><strong>Liefert nach:</strong> ${lieferBL.map(escapeHtml).join(", ")}</p>` : "<p><strong>Liefergebiet:</strong> bundesweit (keine Beschränkung angegeben)</p>"}
      ${baumarten.length > 0 ? `<p><strong>Sortiment:</strong> ${baumarten.map(escapeHtml).join(", ")}</p>` : ""}
      ${kapazitaet ? `<p><strong>Kapazität/Hinweise:</strong><br>${escapeHtml(kapazitaet).replace(/\n/g, "<br>")}</p>` : ""}
      <p><strong>ZÜF-zertifiziert:</strong> ${zufZertifiziert ? "ja" : "nein"}</p>
      <hr>
      <p>👉 <a href="https://ka-forstmanager.vercel.app/saatguternte/baumschulen/${created.id}">Im Admin-Panel öffnen &amp; freigeben</a></p>
    `,
  }).catch((e) => console.warn("[Registrierung] Admin-Mail fehlgeschlagen:", e))

  // Bestätigungs-Mail an Antragsteller (Best-Effort)
  void sendEmail({
    to: email,
    subject: `Ihre Bewerbung bei Koch Aufforstung — Bestätigung`,
    html: `
      <p>Sehr geehrte/r ${escapeHtml(ansprechpartner)},</p>
      <p>vielen Dank für Ihr Interesse, Teil unseres Baumschul-Netzwerks zu werden.</p>
      <p>Wir haben Ihre Bewerbung für <strong>${escapeHtml(firmenname)}</strong> erhalten und melden uns innerhalb von <strong>2 Werktagen</strong>.</p>
      <p>Sobald wir Sie freigegeben haben, erhalten Sie einen persönlichen Login-Link für Ihr Baumschul-Portal — dort können Sie eingehende Pflanzanfragen aus unserem Netzwerk einsehen und beantworten.</p>
      <p>Mit freundlichen Grüßen<br>Ihr Team der Koch Aufforstung GmbH</p>
    `,
  }).catch((e) => console.warn("[Registrierung] Bestätigungsmail fehlgeschlagen:", e))

  return NextResponse.json(
    { success: true, id: created.id, status: created.status },
    { status: 201, headers: cors }
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
