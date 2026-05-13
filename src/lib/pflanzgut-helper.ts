import type { LagerArtikel } from "@prisma/client"

export interface PflanzgutDTO {
  id: number
  name: string
  einheit: string
  kategorie: "pflanzgut"
  baumart: string
  groesse: string
  herkunft: string
  bestand_ist: number
  bestand_soll: number
  mindestbestand: number
  lagerort?: string | null
  qr_code?: string | null
  created_at?: string
  updated_at?: string
  baumart_katalog_id?: string
  /** Original cuid für interne Operationen (nicht von der App genutzt). */
  _cuid: string
}

/**
 * Stabile numerische ID aus cuid (siehe urlaub-helper).
 */
export function pflanzgutIdToNumber(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Mapped einen LagerArtikel auf die PflanzgutDTO-Form, die die App erwartet.
 * Felder wie baumart/groesse/herkunft existieren im Schema nicht — Stub-Werte.
 */
export function mapLagerToPflanzgut(a: LagerArtikel): PflanzgutDTO {
  return {
    id: pflanzgutIdToNumber(a.id),
    name: a.name,
    einheit: a.einheit ?? "Stück",
    kategorie: "pflanzgut",
    baumart: "",
    groesse: "",
    herkunft: "",
    bestand_ist: a.bestand,
    bestand_soll: 0,
    mindestbestand: a.mindestbestand,
    lagerort: a.lagerort,
    qr_code: a.artikelnummer,
    created_at: a.createdAt?.toISOString(),
    updated_at: a.updatedAt?.toISOString(),
    _cuid: a.id,
  }
}
