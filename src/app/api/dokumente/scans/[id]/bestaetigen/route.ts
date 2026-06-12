/**
 * DOK-029/030: POST /api/dokumente/scans/[id]/bestaetigen
 *
 * Human-in-the-Loop-Bestätigung eines Scans (REVIEW_ERFORDERLICH → GEBUCHT):
 * - Nur Admin/Gruppenführer
 * - Optionale Positions-Korrekturen (lagerArtikelId, mengeErhalten) → matchStatus MANUELL
 *   + Alias-Lernen (US-8: LagerArtikelAlias quelle=GELERNT)
 * - Lagerbuchung in EINER Transaktion: LagerBewegung "eingang" + Bestand-Increment
 *   (GUTSCHRIFT: "korrektur" + Decrement)
 * - AuditLog BESTAETIGT + GEBUCHT; danach unveränderlich (State-Machine: GEBUCHT → [])
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import type { ExtrahiertePosition, Prisma } from "@prisma/client"

const BodySchema = z.object({
  korrekturen: z
    .array(
      z.object({
        positionId: z.string(),
        lagerArtikelId: z.string().nullable().optional(),
        mengeErhalten: z.number().positive().optional(),
      })
    )
    .optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const { id } = await params
  try {
    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Korrekturen" }, { status: 400 })
    }

    const scan = await prisma.dokumentenScan.findFirst({
      where: { id, deletedAt: null },
      include: { positionen: true },
    })
    if (!scan) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    if (scan.status !== "REVIEW_ERFORDERLICH") {
      return NextResponse.json(
        { error: `Bestätigung nur aus REVIEW_ERFORDERLICH möglich (aktuell: ${scan.status})` },
        { status: 409 }
      )
    }

    const userId = (session.user as { id?: string }).id || session.user.email || "unbekannt"
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

    // Korrekturen auf Positionen anwenden (in-memory, persistiert in Transaktion)
    const korrekturMap = new Map(
      (parsed.data.korrekturen ?? []).map((k) => [k.positionId, k])
    )
    const positionen = scan.positionen.map((p: ExtrahiertePosition) => {
      const k = korrekturMap.get(p.id)
      if (!k) return { ...p, manuell: false }
      return {
        ...p,
        lagerArtikelId: k.lagerArtikelId !== undefined ? k.lagerArtikelId : p.lagerArtikelId,
        mengeErhalten: k.mengeErhalten ?? p.mengeErhalten,
        manuell: true,
      }
    })

    // Alle buchbaren Positionen brauchen einen Artikel — sonst kein GEBUCHT
    const ohneArtikel = positionen.filter((p: (typeof positionen)[number]) => !p.lagerArtikelId)
    if (ohneArtikel.length > 0) {
      return NextResponse.json(
        {
          error: `${ohneArtikel.length} Position(en) ohne Lager-Artikel — bitte zuordnen oder ablehnen`,
          positionen: ohneArtikel.map((p: (typeof positionen)[number]) => ({
            id: p.id,
            bezeichnung: p.artikelBezeichnung,
          })),
        },
        { status: 422 }
      )
    }

    const istGutschrift = scan.typ === "GUTSCHRIFT"
    const vorzeichen = istGutschrift ? -1 : 1

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const p of positionen) {
        const menge = p.mengeErhalten ?? p.mengeErwartet
        if (!Number.isFinite(menge) || menge <= 0) continue

        // Positions-Korrektur persistieren
        if (p.manuell) {
          await tx.extrahiertePosition.update({
            where: { id: p.id },
            data: {
              lagerArtikelId: p.lagerArtikelId,
              mengeErhalten: p.mengeErhalten,
              matchStatus: "MANUELL",
            },
          })
          // US-8 Feedback-Loop: manuelle Zuordnung als Alias lernen
          if (p.lagerArtikelId) {
            const existiert = await tx.lagerArtikelAlias.findFirst({
              where: { lagerArtikelId: p.lagerArtikelId, alias: p.artikelBezeichnung },
            })
            if (!existiert) {
              await tx.lagerArtikelAlias.create({
                data: {
                  lagerArtikelId: p.lagerArtikelId,
                  alias: p.artikelBezeichnung,
                  quelle: "GELERNT",
                },
              })
            }
          }
        }

        // Lagerbuchung
        await tx.lagerArtikel.update({
          where: { id: p.lagerArtikelId! },
          data: { bestand: { increment: vorzeichen * menge } },
        })
        await tx.lagerBewegung.create({
          data: {
            artikelId: p.lagerArtikelId!,
            typ: istGutschrift ? "korrektur" : "eingang",
            menge: vorzeichen * menge,
            referenz: scan.id,
            notiz: `Dokumenten-KI: ${scan.originalDateiName} (${scan.typ})`,
          },
        })
      }

      await tx.dokumentenScan.update({
        where: { id: scan.id },
        data: {
          status: "GEBUCHT",
          auditLog: {
            createMany: {
              data: [
                {
                  aktion: "BESTAETIGT",
                  userId,
                  ipAdresse: ip,
                  details: {
                    korrekturen: parsed.data.korrekturen?.length ?? 0,
                    positionen: positionen.length,
                  },
                },
                {
                  aktion: "GEBUCHT",
                  userId,
                  ipAdresse: ip,
                  details: {
                    bewegungen: positionen.length,
                    richtung: istGutschrift ? "abgang" : "eingang",
                  },
                },
              ],
            },
          },
        },
      })
    })

    return NextResponse.json({ ok: true, status: "GEBUCHT", bewegungen: positionen.length })
  } catch (error) {
    console.error("[DokumentenScan] Bestätigen fehlgeschlagen:", error)
    return NextResponse.json({ error: "Bestätigung fehlgeschlagen" }, { status: 500 })
  }
}
