/**
 * A8 Rechnungs-Agent — Zahlungseingang erfassen (REC-018)
 *
 * POST /api/rechnungen/:id/zahlung  { betrag, mittel?, datum? }
 *
 * Erfasst (Teil-)Zahlungen, kumuliert zahlungsEingang und setzt den Status:
 *  - >= Bruttobetrag → "bezahlt" (+ paidAt)
 *  - > 0 und < Brutto → "teilbezahlt"
 * Mahnstufe wird bei Vollzahlung zurückgesetzt.
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdminOrGF } from "@/lib/permissions"
import { z } from "zod"

const ZahlungSchema = z.object({
  betrag: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive("Betrag muss positiv sein")),
  mittel: z.string().max(50).optional(),
  datum: z.string().optional().nullable(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = ZahlungSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.issues.map((e) => ({ field: e.path.join("."), message: e.message })) }, { status: 400 })
  }
  const { betrag, mittel, datum } = parsed.data

  const rechnung = await prisma.rechnung.findUnique({
    where: { id },
    select: { id: true, nummer: true, status: true, deletedAt: true, bruttoBetrag: true, betrag: true, zahlungsEingang: true },
  })
  if (!rechnung) return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
  if (rechnung.deletedAt) return NextResponse.json({ error: "Rechnung ist gelöscht" }, { status: 400 })
  if (rechnung.status === "storniert") return NextResponse.json({ error: "Stornierte Rechnung kann keine Zahlung erfassen" }, { status: 400 })

  const brutto = rechnung.bruttoBetrag ?? rechnung.betrag
  const bisher = rechnung.zahlungsEingang ?? 0
  const neuerEingang = Math.round((bisher + betrag) * 100) / 100
  const vollBezahlt = neuerEingang + 0.01 >= brutto
  const zahlungsdatum = datum ? new Date(datum) : new Date()

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.rechnung.update({
        where: { id },
        data: {
          zahlungsEingang: neuerEingang,
          status: vollBezahlt ? "bezahlt" : "teilbezahlt",
          paidAt: vollBezahlt ? zahlungsdatum : null,
          paidViaMittel: mittel ?? "überweisung",
          mahnstufe: vollBezahlt ? 0 : undefined,
        },
      })

      // Offene Mahnungen bei Vollzahlung schließen
      if (vollBezahlt) {
        await tx.mahnungEvent.updateMany({
          where: { rechnungId: id, status: "offen" },
          data: { status: "erledigt" },
        })
      }

      await tx.rechnungAuditLog.create({
        data: {
          rechnungId: id,
          action: "ZAHLUNG",
          field: "zahlungsEingang",
          oldValue: JSON.stringify(bisher),
          newValue: JSON.stringify({ zahlungsEingang: neuerEingang, betrag, mittel: mittel ?? "überweisung", vollBezahlt, datum: zahlungsdatum }),
          userId: session.user?.id ?? null,
          userName: session.user?.name ?? null,
        },
      })

      return r
    })

    return NextResponse.json({
      ok: true,
      rechnung: { id: updated.id, nummer: updated.nummer, status: updated.status, zahlungsEingang: updated.zahlungsEingang, offenerBetrag: Math.max(0, Math.round((brutto - neuerEingang) * 100) / 100) },
    })
  } catch (error) {
    console.error("[A8-ZAHLUNG]", error)
    return NextResponse.json({ error: "Fehler bei der Zahlungserfassung" }, { status: 500 })
  }
}
