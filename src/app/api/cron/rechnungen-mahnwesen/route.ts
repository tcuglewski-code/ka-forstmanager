/**
 * A8 Rechnungs-Agent — Mahnwesen-Cron (REC-011)
 *
 * Läuft täglich (08:00 Berlin) und prüft überfällige Rechnungen.
 * Mahnstufen ab Fälligkeit:
 *   Stufe 1  ab +7 Tagen  — Zahlungserinnerung, Gebühr 0,00 €
 *   Stufe 2  ab +14 Tagen — 1. Mahnung,         Gebühr 5,00 €
 *   Stufe 3  ab +30 Tagen — 2. Mahnung,         Gebühr 15,00 €
 *
 * WICHTIG (Geschäftsentscheidung): KEIN automatischer Versand. Der Cron erzeugt
 * nur MahnungEvent-Einträge (status "offen") + erhöht rechnung.mahnstufe. Der
 * Versand wird vom Vorgesetzten manuell ausgelöst → Mensch im Loop.
 *
 * REC-029: Verzugszinsen-Hinweis (BGB §288: 9 %-Punkte über Basiszins B2B,
 * 5 %-Punkte B2C) wird als Info im MahnungEvent hinterlegt, nicht automatisch
 * berechnet/gefordert.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MAHNBARE_STATUS, zielStufe } from "@/lib/rechnungen/mahnstufen"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const heute = new Date(now); heute.setHours(0, 0, 0, 0)
  let neueMahnungen = 0
  const details: string[] = []

  try {
    const ueberfaellig = await prisma.rechnung.findMany({
      where: {
        deletedAt: null,
        status: { in: MAHNBARE_STATUS },
        faelligAm: { lt: heute },
      },
      select: {
        id: true, nummer: true, status: true, faelligAm: true,
        bruttoBetrag: true, betrag: true, zahlungsEingang: true, mahnstufe: true,
      },
    })

    for (const r of ueberfaellig) {
      if (!r.faelligAm) continue
      const brutto = r.bruttoBetrag ?? r.betrag
      const offen = Math.round((brutto - (r.zahlungsEingang ?? 0)) * 100) / 100
      if (offen <= 0.01) continue // faktisch bezahlt

      const overdueTage = Math.floor((heute.getTime() - new Date(r.faelligAm).getTime()) / (1000 * 60 * 60 * 24))
      const ziel = zielStufe(overdueTage)
      if (!ziel) continue
      if ((r.mahnstufe ?? 0) >= ziel.stufe) continue // Stufe bereits erreicht

      // MahnungEvent idempotent anlegen (unique [rechnungId, stufe])
      try {
        await prisma.$transaction(async (tx) => {
          await tx.mahnungEvent.create({
            data: {
              rechnungId: r.id,
              stufe: ziel.stufe,
              faelligAm: new Date(r.faelligAm!),
              status: "offen", // wartet auf manuellen Versand
              gebuehr: ziel.gebuehr,
              betragOffen: offen,
            },
          })
          await tx.rechnung.update({
            where: { id: r.id },
            data: { mahnstufe: ziel.stufe, status: r.status === "teilbezahlt" ? "teilbezahlt" : "überfällig" },
          })
          await tx.rechnungAuditLog.create({
            data: {
              rechnungId: r.id,
              action: "MAHNUNG",
              field: "mahnstufe",
              oldValue: JSON.stringify(r.mahnstufe ?? 0),
              newValue: JSON.stringify({ stufe: ziel.stufe, label: ziel.label, gebuehr: ziel.gebuehr, betragOffen: offen, overdueTage, verzugszinsenHinweis: "BGB §288 — Verzugszinsen optional, kein Auto-Versand" }),
              userId: "SYSTEM_CRON",
              userName: "Mahnwesen-Cron",
            },
          })
        })
        neueMahnungen++
        details.push(`${r.nummer}: Stufe ${ziel.stufe} (${overdueTage}d, ${offen.toFixed(2)} € offen)`)
      } catch (e) {
        // P2002 = MahnungEvent für diese Stufe existiert bereits → idempotent ignorieren
        if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") continue
        throw e
      }
    }

    const summary = { success: true, timestamp: now.toISOString(), geprueft: ueberfaellig.length, neueMahnungen, details }
    console.log("[Cron rechnungen-mahnwesen]", JSON.stringify(summary))
    return NextResponse.json(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[Cron rechnungen-mahnwesen] Fehler:", message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
