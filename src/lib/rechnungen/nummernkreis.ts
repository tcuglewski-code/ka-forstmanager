/**
 * A8 Rechnungs-Agent — Nummernkreis (REC-002)
 *
 * GoBD-konform: lückenlos, revisionssicher, keine Doppelvergabe.
 * Format: RE-YYYY-NNNN (z.B. RE-2026-0001).
 *
 * Race-Condition-Schutz (Audit D66/D67): Die Nummer wird in einer
 * $transaction mit einer pessimistischen Sperr-Zeile in SystemConfig
 * (`rechnungsnummer_lock_<jahr>`) gezogen. Concurrent-Requests serialisieren
 * sich an dieser Zeile (UPDATE nimmt Row-Lock bis Commit).
 *
 * WICHTIG: Immer innerhalb DERSELBEN Transaktion verwenden, in der auch die
 * Rechnung erstellt wird → bei Rollback wird keine Nummer "verbrannt" (A5).
 */
import { z } from "zod"
import type { Prisma } from "@prisma/client"

const NUMMER_REGEX = /^RE-(\d{4})-(\d{4,})$/

export const RechnungsnummerSchema = z
  .string()
  .regex(NUMMER_REGEX, "Ungültiges Rechnungsnummer-Format (erwartet RE-YYYY-NNNN)")

export function lockKey(jahr: number): string {
  return `rechnungsnummer_lock_${jahr}`
}

/**
 * Zieht die nächste lückenlose Rechnungsnummer für das gegebene Jahr.
 * MUSS innerhalb einer prisma.$transaction(...) mit `tx` aufgerufen werden.
 */
export async function naechsteNummer(
  tx: Prisma.TransactionClient,
  jahr: number = new Date().getFullYear()
): Promise<string> {
  const key = lockKey(jahr)

  // 1. Sperr-Zeile sicherstellen (idempotent). Der nachfolgende UPDATE
  //    nimmt einen Row-Lock und serialisiert parallele Transaktionen.
  await tx.systemConfig.upsert({
    where: { key },
    create: { key, value: "0" },
    update: {},
  })

  // 2. Atomar inkrementieren via raw UPDATE ... RETURNING (Row-Lock bis Commit).
  const rows = await tx.$queryRaw<Array<{ value: string }>>`
    UPDATE "SystemConfig"
    SET "value" = (CAST("value" AS INTEGER) + 1)::text, "updatedAt" = NOW()
    WHERE "key" = ${key}
    RETURNING "value"
  `
  const laufnummer = parseInt(rows[0]?.value ?? "0", 10)
  if (!Number.isInteger(laufnummer) || laufnummer < 1) {
    throw new Error(`Nummernkreis-Fehler: ungültige Laufnummer ${rows[0]?.value} für ${key}`)
  }

  const nummer = `RE-${jahr}-${String(laufnummer).padStart(4, "0")}`
  return RechnungsnummerSchema.parse(nummer)
}

/**
 * Diagnose: prüft den Nummernkreis eines Jahres auf Lücken.
 * Gibt fehlende Laufnummern zurück (für GoBD-Audit-Job).
 */
export async function findeLuecken(
  prismaLike: { rechnung: { findMany: (a: unknown) => Promise<Array<{ nummer: string }>> } },
  jahr: number
): Promise<number[]> {
  const rechnungen = await prismaLike.rechnung.findMany({
    where: { nummer: { startsWith: `RE-${jahr}-` } },
    select: { nummer: true },
  })
  const nummern = rechnungen
    .map((r) => {
      const m = r.nummer.match(NUMMER_REGEX)
      return m ? parseInt(m[2], 10) : null
    })
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b)

  if (nummern.length === 0) return []
  const luecken: number[] = []
  for (let i = nummern[0]; i <= nummern[nummern.length - 1]; i++) {
    if (!nummern.includes(i)) luecken.push(i)
  }
  return luecken
}
