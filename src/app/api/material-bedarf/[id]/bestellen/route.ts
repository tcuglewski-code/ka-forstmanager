/**
 * A2 — POST /api/material-bedarf/[id]/bestellen (MAT-009)
 * Body: { bestellVorschlagId }. Markiert einen Bestellvorschlag als BESTELLT
 * und benachrichtigt den Lieferanten/die Baumschule (Human-in-the-Loop).
 * Idempotent: bereits bestellte Vorschläge lösen keinen erneuten Versand aus.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { sendEmail } from "@/lib/email"
import { safeParseJson, BestellPositionenSnapshotSchema } from "@/lib/material/zod-schemas"

export const POST = withErrorHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const bestellVorschlagId =
      typeof body.bestellVorschlagId === "string" ? body.bestellVorschlagId : null
    if (!bestellVorschlagId) {
      return NextResponse.json({ error: "bestellVorschlagId erforderlich" }, { status: 400 })
    }

    const vorschlag = await prisma.bestellVorschlag.findUnique({
      where: { id: bestellVorschlagId },
      include: {
        lieferant: { select: { name: true, email: true } },
        baumschule: { select: { name: true, email: true } },
      },
    })
    if (!vorschlag || vorschlag.materialBedarfId !== id) {
      return NextResponse.json({ error: "Bestellvorschlag nicht gefunden" }, { status: 404 })
    }

    // Idempotenz: bereits bestellt → ohne erneuten Versand bestätigen.
    if (vorschlag.status !== "VORSCHLAG") {
      return NextResponse.json({ ok: true, status: vorschlag.status, bereitsBestellt: true })
    }

    const aktualisiert = await prisma.bestellVorschlag.update({
      where: { id: bestellVorschlagId },
      data: { status: "BESTELLT", bestelltAm: new Date() },
    })
    await prisma.materialBedarf.update({ where: { id }, data: { status: "BESTELLT" } })

    // Lieferant/Baumschule benachrichtigen (graceful — Fehler nicht fatal).
    const empfaengerEmail = vorschlag.lieferant?.email || vorschlag.baumschule?.email || null
    const empfaengerName =
      vorschlag.lieferant?.name || vorschlag.baumschule?.name || vorschlag.lieferantName || "Lieferant"
    let benachrichtigt = false
    if (empfaengerEmail) {
      try {
        const positionen = safeParseJson(BestellPositionenSnapshotSchema, vorschlag.positionenJson, [])
        const zeilen = positionen
          .map((p) => `- ${p.bezeichnung}: ${p.menge}${p.preis != null ? ` (à ${p.preis} €)` : ""}`)
          .join("\n")
        await sendEmail({
          to: empfaengerEmail,
          subject: `Materialbestellung — Koch Aufforstung`,
          html: `<p>Guten Tag ${empfaengerName},</p><p>wir möchten folgendes Material bestellen:</p><pre>${zeilen}</pre><p>Gesamtbetrag (netto, geschätzt): ${aktualisiert.gesamtBetrag} €</p><p>Bitte bestätigen Sie Verfügbarkeit und Liefertermin.</p><p>Mit freundlichen Grüßen<br>Koch Aufforstung GmbH</p>`,
        })
        benachrichtigt = true
      } catch (e) {
        console.warn("[Material-Bestellen] Benachrichtigung fehlgeschlagen:", e)
      }
    }

    return NextResponse.json({ ok: true, status: aktualisiert.status, benachrichtigt })
  }
)
