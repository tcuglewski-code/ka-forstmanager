import { prisma } from "@/lib/prisma"

export type UrlaubStatus = "beantragt" | "genehmigt" | "abgelehnt"

export interface UrlaubAntragDTO {
  id: number
  user_id: number
  user_name: string
  von: string
  bis: string
  tage: number
  bemerkung: string
  status: UrlaubStatus
  admin_kommentar?: string
  bearbeitet_von?: string
  bearbeitet_am?: string
  created_at: string
}

export interface UrlaubKontoDTO {
  user_id: number
  jahr: number
  urlaubstage_gesamt: number
  urlaubstage_genommen: number
  urlaubstage_beantragt: number
  urlaubstage_verbleibend: number
}

/**
 * Berechnet Werktage (Mo-Fr) zwischen zwei Daten (inklusive).
 */
export function calculateWorkdays(von: Date, bis: Date): number {
  if (bis < von) return 0
  let count = 0
  const current = new Date(von)
  while (current <= bis) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

/**
 * Stabile numerische ID aus String-ID (cuid) für API-Kompatibilität.
 * Nutzt einen einfachen Hash — Kollisionen sind in der Praxis sehr selten.
 */
export function stringIdToNumber(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

interface AbwesenheitWithMitarbeiter {
  id: string
  mitarbeiterId: string
  von: Date
  bis: Date
  typ: string
  genehmigt: boolean
  notiz: string | null
  createdAt: Date
  mitarbeiter?: {
    id: string
    vorname: string
    nachname: string
  } | null
}

/**
 * Mapped eine Abwesenheit zum API-DTO. Status wird aus `genehmigt` abgeleitet:
 *  - genehmigt=true  → 'genehmigt'
 *  - genehmigt=false → 'beantragt'
 * 'abgelehnt' wird (mangels separater Spalte) durch Löschen modelliert.
 */
export function mapAbwesenheitToDTO(
  a: AbwesenheitWithMitarbeiter
): UrlaubAntragDTO {
  const tage = calculateWorkdays(a.von, a.bis)
  const userName = a.mitarbeiter
    ? `${a.mitarbeiter.vorname} ${a.mitarbeiter.nachname}`.trim()
    : ""
  return {
    id: stringIdToNumber(a.id),
    user_id: stringIdToNumber(a.mitarbeiterId),
    user_name: userName,
    von: a.von.toISOString().slice(0, 10),
    bis: a.bis.toISOString().slice(0, 10),
    tage,
    bemerkung: a.notiz ?? "",
    status: a.genehmigt ? "genehmigt" : "beantragt",
    created_at: a.createdAt.toISOString(),
  }
}

/**
 * Ermittelt die Mitarbeiter-ID des aktuellen App-Users.
 */
export async function resolveMitarbeiterId(
  appUser: Record<string, unknown>
): Promise<string | null> {
  const direct = appUser.mitarbeiterId
  if (typeof direct === "string" && direct.length > 0) return direct
  const sub = typeof appUser.sub === "string" ? appUser.sub : null
  if (!sub) return null
  const linked = await prisma.mitarbeiter.findFirst({
    where: { userId: sub },
    select: { id: true },
  })
  return linked?.id ?? null
}

/**
 * Berechnet das Urlaubskonto eines Mitarbeiters für ein Jahr.
 * Default: 30 Urlaubstage/Jahr.
 */
export async function getUrlaubKontoFor(
  mitarbeiterId: string,
  jahr = new Date().getFullYear(),
  urlaubstageGesamt = 30
): Promise<UrlaubKontoDTO> {
  const von = new Date(`${jahr}-01-01T00:00:00Z`)
  const bis = new Date(`${jahr}-12-31T23:59:59Z`)

  const eintraege = await prisma.abwesenheit.findMany({
    where: {
      mitarbeiterId,
      typ: "urlaub",
      von: { gte: von, lte: bis },
    },
    select: { von: true, bis: true, genehmigt: true },
  })

  let genommen = 0
  let beantragt = 0
  for (const e of eintraege) {
    const t = calculateWorkdays(e.von, e.bis)
    if (e.genehmigt) genommen += t
    else beantragt += t
  }

  return {
    user_id: stringIdToNumber(mitarbeiterId),
    jahr,
    urlaubstage_gesamt: urlaubstageGesamt,
    urlaubstage_genommen: genommen,
    urlaubstage_beantragt: beantragt,
    urlaubstage_verbleibend: urlaubstageGesamt - genommen - beantragt,
  }
}
