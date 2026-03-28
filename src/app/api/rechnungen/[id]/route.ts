import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"
// Sprint FW (E5): Email bei Freigabe
import { sendEmail, rechnungEmailHtml } from "@/lib/email"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const { id } = await params
    await prisma.rechnung.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    console.error("[RECHNUNG DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const rechnung = await prisma.rechnung.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.notizen !== undefined && { notizen: body.notizen }),
      ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl }),
      ...(body.faelligAm && { faelligAm: new Date(body.faelligAm) }),
    },
    include: {
      auftrag: {
        select: {
          id: true,
          titel: true,
          waldbesitzer: true,
          waldbesitzerEmail: true,
        },
      },
    },
  })

  // Sprint FW (E5): Email bei Freigabe senden
  if (body.status === "freigegeben" && rechnung.auftrag?.waldbesitzerEmail) {
    const emailHtml = rechnungEmailHtml({
      rechnungNummer: rechnung.nummer,
      kundenName: rechnung.auftrag.waldbesitzer ?? "Kunde",
      betrag: rechnung.betrag,
      faelligAm: rechnung.faelligAm?.toISOString(),
    })

    // Async Email senden (nicht blockierend)
    sendEmail({
      to: rechnung.auftrag.waldbesitzerEmail,
      subject: `Rechnung ${rechnung.nummer} - Koch Aufforstung GmbH`,
      html: emailHtml,
    }).catch(err => console.error("[Rechnung Email Fehler]", err))
  }

  return NextResponse.json(rechnung)
}

/**
 * PUT /api/rechnungen/[id]
 *
 * Erlaubt nachträgliche Bearbeitung einer Rechnung:
 * - rabatt (Prozent 0-100)
 * - rabattBetrag (absoluter Betrag, wird bei Angabe bevorzugt)
 * - rabattGrund (Text)
 * - zahlungsBedingung
 * - notizen
 * - status (entwurf → versendet → bezahlt → storniert)
 *
 * Berechnet nettoBetrag und bruttoBetrag automatisch neu aus
 * den vorhandenen Positionen nach Anwendung des Rabatts.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // Aktuelle Rechnung mit Positionen laden
  const aktuelleRechnung = await prisma.rechnung.findUnique({
    where: { id },
    include: { positionen: true },
  })

  if (!aktuelleRechnung) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  // Stornierte Rechnung kann nicht mehr bearbeitet werden
  if (aktuelleRechnung.status === 'storniert' && body.status !== 'storniert') {
    return NextResponse.json({ error: "Stornierte Rechnung kann nicht bearbeitet werden" }, { status: 400 })
  }

  // MwSt-Satz: aus Body oder bestehende Rechnung
  const mwst = body.mwstSatz !== undefined ? body.mwstSatz : aktuelleRechnung.mwst

  // Nettobetrag aus Positionen berechnen
  const summePositionen = aktuelleRechnung.positionen.reduce(
    (s, p) => s + p.gesamt,
    0
  )

  // Nettobetrag: entweder aus Positionen oder beibehalten
  const nettoBetrag = summePositionen > 0 ? summePositionen : (aktuelleRechnung.nettoBetrag ?? aktuelleRechnung.betrag)

  // Rabatt bestimmen
  let rabatt = aktuelleRechnung.rabatt ?? 0
  let rabattBetrag = aktuelleRechnung.rabattBetrag ?? 0

  if (body.rabattBetrag !== undefined) {
    // Absoluter Betrag angegeben
    rabattBetrag = body.rabattBetrag
    rabatt = nettoBetrag > 0 ? (rabattBetrag / nettoBetrag) * 100 : 0
  } else if (body.rabatt !== undefined) {
    // Prozent angegeben
    rabatt = Math.min(100, Math.max(0, body.rabatt))
    rabattBetrag = nettoBetrag * (rabatt / 100)
  }

  const nettoNachRabatt = nettoBetrag - rabattBetrag
  const bruttoBetrag = nettoNachRabatt * (1 + mwst)

  const updateData: Record<string, any> = {
    nettoBetrag,
    bruttoBetrag,
    betrag: bruttoBetrag,
    rabatt,
    rabattBetrag,
    mwst,
  }

  if (body.rabattGrund !== undefined) updateData.rabattGrund = body.rabattGrund
  if (body.zahlungsBedingung !== undefined) updateData.zahlungsBedingung = body.zahlungsBedingung
  if (body.notizen !== undefined) updateData.notizen = body.notizen
  if (body.status !== undefined) updateData.status = body.status
  if (body.faelligAm !== undefined) updateData.faelligAm = new Date(body.faelligAm)
  if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl

  const rechnung = await prisma.rechnung.update({
    where: { id },
    data: updateData,
    include: {
      positionen: true,
      auftrag: { select: { id: true, titel: true } },
    },
  })

  return NextResponse.json(rechnung)
}
