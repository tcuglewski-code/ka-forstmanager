/**
 * A1 — Öffentliches Waldbesitzer-Portal (ANG-033)
 * GET: Angebot per Tracking-Token (KEIN Login). Loggt "geoeffnet".
 * POST: Kunde nimmt an / lehnt ab → Status + Tracking. Keine PII in Logs.
 */
import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function ipHashFrom(req: Request): string | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  if (!ip) return null
  const salt = process.env.NEXTAUTH_SECRET ?? "ka-salt"
  return crypto.createHash("sha256").update(ip + salt).digest("hex")
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const angebot = await prisma.angebot.findUnique({
    where: { trackingToken: token },
    include: {
      positionen: { orderBy: { reihenfolge: "asc" } },
      varianten: { orderBy: { gesamtNetto: "asc" } },
    },
  })
  if (!angebot) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  if (!angebot.trackingOptOut) {
    await prisma.angebotsTracking.create({
      data: {
        angebotId: angebot.id,
        ereignis: "geoeffnet",
        ipHash: ipHashFrom(req),
        userAgent: req.headers.get("user-agent")?.slice(0, 256) ?? null,
      },
    })
  }

  return NextResponse.json({
    nummer: angebot.nummer,
    beschreibung: angebot.beschreibung,
    waldbesitzerName: angebot.waldbesitzerName,
    status: angebot.status,
    gesamtNetto: angebot.gesamtNetto,
    mwstBetrag: angebot.mwstBetrag,
    gesamtBrutto: angebot.gesamtpreis,
    gueltigBis: angebot.gueltigBis,
    foerderHinweis: angebot.foerderHinweis,
    positionen: angebot.positionen.map((p: (typeof angebot.positionen)[number]) => ({
      bezeichnung: p.bezeichnung,
      menge: p.menge,
      einheit: p.einheit,
      einzelpreis: p.einzelpreis,
      gesamtpreis: p.gesamtpreis,
    })),
    varianten: angebot.varianten.map((v: (typeof angebot.varianten)[number]) => ({
      stufe: v.stufe,
      titel: v.titel,
      verkaufstext: v.verkaufstext,
      gesamtBrutto: v.gesamtBrutto,
    })),
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json().catch(() => ({}))
  const aktion = body.aktion === "ablehnen" ? "ablehnen" : body.aktion === "annehmen" ? "annehmen" : null
  if (!aktion) return NextResponse.json({ error: "aktion erforderlich (annehmen|ablehnen)" }, { status: 400 })

  const angebot = await prisma.angebot.findUnique({
    where: { trackingToken: token },
    select: { id: true, status: true },
  })
  if (!angebot) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  if (["angenommen", "abgelehnt"].includes(angebot.status)) {
    return NextResponse.json({ error: "Bereits abgeschlossen" }, { status: 400 })
  }

  const neuStatus = aktion === "annehmen" ? "angenommen" : "abgelehnt"
  await prisma.angebot.update({
    where: { id: angebot.id },
    data: {
      status: neuStatus,
      ...(aktion === "ablehnen" && typeof body.grund === "string" ? { abgelehntGrund: body.grund.slice(0, 500) } : {}),
    },
  })
  await prisma.angebotsTracking.create({
    data: { angebotId: angebot.id, ereignis: neuStatus, ipHash: ipHashFrom(req) },
  })
  // Offene Follow-ups stoppen
  await prisma.angebotsFollowUp.updateMany({
    where: { angebotId: angebot.id, status: "offen" },
    data: { status: "uebersprungen" },
  })

  return NextResponse.json({ ok: true, status: neuStatus })
}
