import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/saatguternte/crawl/hessen
 *
 * Triggt den Hessen-Crawler (scripts/crawler-hessen.py).
 *
 * HINWEIS: In Vercel Serverless-Umgebung ist child_process.spawn für lang laufende
 * Python-Prozesse nicht geeignet (max. 10s Timeout auf Hobby/Pro, 300s auf Enterprise).
 * Der Crawler läuft ~5-10 Minuten → muss lokal ausgeführt werden.
 *
 * Stattdessen: Status auf 'manual_required' setzen und Anweisung zurückgeben.
 */
export async function POST() {
  try {
    // NW-FVA Quelle aus DB holen
    const quelle = await prisma.ernteRegisterQuelle.findFirst({
      where: { kuerzel: "NW-FVA" },
    })

    if (!quelle) {
      return NextResponse.json(
        { ok: false, error: "NW-FVA Quelle nicht in der Datenbank gefunden." },
        { status: 404 }
      )
    }

    // Status auf manual_required setzen
    await prisma.ernteRegisterQuelle.update({
      where: { id: quelle.id },
      data: {
        crawlStatus: "manual_required",
        crawlLog: `[${new Date().toISOString()}] Manueller Start angefordert via UI.\nDer Crawler kann nicht in Vercel Serverless ausgeführt werden (Timeout).\nBitte lokal ausführen:\n\n  cd ka-forstmanager\n  python3 scripts/crawler-hessen.py\n`,
      },
    })

    return NextResponse.json({
      ok: true,
      status: "manual_required",
      message:
        "Der Hessen-Crawler kann in der Vercel-Serverless-Umgebung nicht direkt gestartet werden (Python-Prozess, langer Lauf ~5-10 Min).",
      anweisung: "Bitte lokal ausführen: python3 scripts/crawler-hessen.py",
      script: "scripts/crawler-hessen.py",
    })
  } catch (err) {
    console.error("POST /api/saatguternte/crawl/hessen", err)
    return NextResponse.json(
      { ok: false, error: "Interner Fehler beim Setzen des Crawler-Status." },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const quelle = await prisma.ernteRegisterQuelle.findFirst({
      where: { kuerzel: "NW-FVA" },
      include: {
        _count: { select: { flaechen: true } },
      },
    })

    if (!quelle) {
      return NextResponse.json({ ok: false, error: "NW-FVA Quelle nicht gefunden." }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      id: quelle.id,
      name: quelle.name,
      crawlStatus: quelle.crawlStatus,
      letzterCrawl: quelle.letzterCrawl?.toISOString() ?? null,
      crawlLog: quelle.crawlLog ?? null,
      flaechenAnzahl: quelle._count.flaechen,
      script: "scripts/crawler-hessen.py",
    })
  } catch (err) {
    console.error("GET /api/saatguternte/crawl/hessen", err)
    return NextResponse.json({ ok: false, error: "Interner Fehler." }, { status: 500 })
  }
}
