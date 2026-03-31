import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: artikelId } = await params

  const bewegungen = await prisma.lagerBewegung.findMany({
    where: { artikelId },
    include: {
      auftrag: { select: { id: true, titel: true } },
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(bewegungen)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id: artikelId } = await params
    const body = await req.json()
    const menge = parseFloat(body.menge)

    // KD-3: Mengenvalidierung - prüfe aktuellen Bestand vor Buchung
    if (body.typ === "ausgang" || body.typ === "reserve" || body.typ === "zuweisung") {
      const artikel = await prisma.lagerArtikel.findUnique({
        where: { id: artikelId },
        select: { bestand: true, mindestbestand: true, name: true },
      })

      if (!artikel) {
        return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 })
      }

      // Prüfe ob genug Bestand vorhanden
      if (artikel.bestand < menge) {
        return NextResponse.json({
          error: "Bestand nicht ausreichend",
          message: `Artikel "${artikel.name}" hat nur ${artikel.bestand} Einheiten auf Lager. Angefordert: ${menge}`,
          verfuegbar: artikel.bestand,
          angefordert: menge,
        }, { status: 400 })
      }

      // Warnung wenn unter Mindestbestand nach Buchung
      const neuerBestand = artikel.bestand - menge
      if (artikel.mindestbestand && neuerBestand < artikel.mindestbestand) {
        console.warn(`[Lager] Artikel ${artikel.name} fällt unter Mindestbestand: ${neuerBestand} < ${artikel.mindestbestand}`)
      }
    }

    const bewegung = await prisma.lagerBewegung.create({
      data: {
        artikelId,
        typ: body.typ,
        menge,
        referenz: body.referenz ?? null,
        notiz: body.notiz ?? null,
        auftragId: body.auftragId || null,
        mitarbeiterId: body.mitarbeiterId || null,
      },
    })

    // Update bestand: eingang/rueckgabe addieren, ausgang/reserve/zuweisung subtrahieren
    const delta = (body.typ === "eingang" || body.typ === "rueckgabe")
      ? menge
      : (body.typ === "ausgang" || body.typ === "reserve" || body.typ === "zuweisung")
      ? -menge
      : menge // korrektur + andere = positiv
    await prisma.lagerArtikel.update({
      where: { id: artikelId },
      data: { bestand: { increment: delta } },
    })

    return NextResponse.json(bewegung, { status: 201 })
  } catch (error) {
    console.error("[Lager Bewegung POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
