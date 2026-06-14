/**
 * A8 Rechnungs-Agent — Rechnungsentwurf aus Auftrag generieren (REC-007)
 *
 * POST /api/rechnungen/generieren  { auftragId }
 *
 * Ablauf:
 *  1. Kill-Switch (NEVER #21): istAgentAktiv() == false → 503 (Shadow-Mode).
 *  2. Abrechnungsbereitschaft prüfen (REC-005, C64 Doppel-Abrechnung).
 *  3. Deterministischen Extrakt bauen (REC-003, kein LLM).
 *  4. Rechnung + Positionen + RechnungsDraft in EINER Transaktion persistieren,
 *     Nummer lückenlos gezogen (REC-002).
 *
 * Erstellt Status "entwurf" — Freigabe erfolgt separat (REC-013).
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"
import { z } from "zod"
import { istAgentAktiv } from "@/lib/rechnungen/config"
import { pruefeAbrechnungsbereit } from "@/lib/rechnungen/abrechnungsbereit"
import { baueExtraktAusAuftrag } from "@/lib/rechnungen/aus-auftrag"
import { naechsteNummer } from "@/lib/rechnungen/nummernkreis"

const GenerierenSchema = z.object({
  auftragId: z.string().min(1, "auftragId erforderlich"),
  ignoriereBestehende: z.boolean().optional(), // Override Doppel-Abrechnung-Schutz
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // NEVER #21: Kill-Switch — Agent-Automatik nur wenn aktiv freigeschaltet
  if (!(await istAgentAktiv())) {
    return NextResponse.json(
      { error: "Rechnungs-Agent ist deaktiviert (Shadow-Mode). Aktivierung über Einstellungen.", code: "AGENT_INACTIVE" },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const parsed = GenerierenSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Daten", details: parsed.error.issues.map((e) => ({ field: e.path.join("."), message: e.message })) },
      { status: 400 }
    )
  }
  const { auftragId, ignoriereBestehende } = parsed.data

  // Abrechnungsbereitschaft (Status, Abnahme, Doppel-Abrechnung)
  const check = await pruefeAbrechnungsbereit(auftragId)
  if (!check.bereit) {
    return NextResponse.json({ error: check.grund, check }, { status: 409 })
  }
  if (check.bestehendeRechnung && !ignoriereBestehende) {
    return NextResponse.json(
      {
        error: `Aktive Rechnung ${check.bestehendeRechnung.nummer} existiert bereits (Doppel-Abrechnung-Schutz). Mit ignoriereBestehende=true erzwingen.`,
        code: "DUPLICATE_INVOICE",
        bestehendeRechnung: check.bestehendeRechnung,
      },
      { status: 409 }
    )
  }

  // Deterministischer Extrakt (kein LLM)
  const ergebnis = await baueExtraktAusAuftrag(auftragId)
  if (!ergebnis.ok || !ergebnis.extrakt) {
    return NextResponse.json({ error: ergebnis.fehlerText ?? "Extrakt fehlgeschlagen" }, { status: 422 })
  }
  const extrakt = ergebnis.extrakt

  try {
    const rechnung = await prisma.$transaction(async (tx) => {
      const draft = await tx.rechnungsDraft.create({
        data: {
          auftragId,
          angebotId: extrakt.angebotId ?? null,
          quelleTyp: extrakt.quelleTyp,
          status: "GENERIERT",
          extraktJson: extrakt as unknown as object,
          erstelltVon: session.user?.id ?? null,
        },
      })

      const nummer = await naechsteNummer(tx)

      const created = await tx.rechnung.create({
        data: {
          nummer,
          auftragId,
          angebotId: extrakt.angebotId ?? null,
          draftId: draft.id,
          quelleTyp: extrakt.quelleTyp,
          betrag: extrakt.bruttoGesamt,
          nettoBetrag: extrakt.nettoGesamt,
          bruttoBetrag: extrakt.bruttoGesamt,
          mwstBetrag: extrakt.mwstGesamt,
          // Repräsentativer Satz fürs Listen-Display (Positionen tragen echte Sätze)
          mwst: extrakt.positionen[0]?.mwstSatz ?? 19,
          status: "entwurf",
          notizen: extrakt.hinweise.length > 0 ? extrakt.hinweise.join("\n") : null,
          positionen: {
            create: extrakt.positionen.map((p) => ({
              beschreibung: p.beschreibung,
              menge: p.menge,
              einheit: p.einheit,
              preisProEinheit: p.einzelpreis,
              gesamt: p.gesamt,
              typ: p.typ,
              mwstSatz: p.mwstSatz,
              auftragPositionId: p.auftragPositionId ?? null,
              angebotPositionId: p.angebotPositionId ?? null,
            })),
          },
        },
        include: { positionen: true, auftrag: { select: { id: true, titel: true } } },
      })

      await tx.rechnungAuditLog.create({
        data: {
          rechnungId: created.id,
          action: "CREATE",
          field: "all",
          newValue: JSON.stringify({ nummer: created.nummer, quelle: "A8-AGENT", auftragId, brutto: created.bruttoBetrag, draftId: draft.id, hinweise: extrakt.hinweise }),
          userId: session.user?.id ?? null,
          userName: session.user?.name ?? null,
        },
      })

      return created
    })

    return NextResponse.json({ ok: true, rechnung, hinweise: extrakt.hinweise }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Rechnungsnummer-Kollision. Bitte erneut versuchen." }, { status: 409 })
    }
    console.error("[A8-GENERIEREN]", error)
    return NextResponse.json({ error: "Fehler beim Generieren der Rechnung" }, { status: 500 })
  }
}
