/**
 * A2 — Material-Bedarf-Orchestrator (MAT-007).
 *
 * Verkettet: Input-Spezifikation → deterministische Reforest-Positionen
 * → (Sprint 2) LLM-Fallback für Unbekanntes → Lager-Abgleich → Persistenz.
 * Standard-Mengen sind deterministisch (kein LLM, NEVER #23/#24).
 */
import { prisma } from "@/lib/prisma"
import { MAT_CONFIG_KEYS, getMatConfigNumber, isMatAgentAktiv } from "@/lib/material/config"
import {
  MatInputSpezifikationSchema,
  type MatInputSpezifikation,
} from "@/lib/material/zod-schemas"
import {
  parsePflanzverband,
  berechnePflanzenzahl,
  berechneVerbissschutz,
  berechneZaunlaenge,
  berechnePfahlanzahl,
  berechneSaatgut,
} from "@/lib/material/reforest-rechner"
import { gleicheAbLager, type BedarfsPosition } from "@/lib/material/lager-abgleich"
import { erzeugeBestellvorschlaege } from "@/lib/material/bestellvorschlag"

export interface RohPosition {
  bezeichnung: string
  menge: number
  einheit: string // stueck, kg, lm, m2
  quelle: "FORMEL" | "LLM" | "MANUELL"
  berechnungsFormel: string | null
  konfidenz: number
}

/**
 * Erzeugt aus der Spezifikation deterministische Materialpositionen.
 * Gibt zusätzlich die Baumarten zurück, für die kein Saatgut-Richtwert
 * existiert (→ Kandidaten für LLM-Fallback in Sprint 2).
 */
export function baueDeterministischePositionen(
  spez: MatInputSpezifikation,
  opts: { verbissPufferProzent: number; pfahlAbstandM: number }
): { positionen: RohPosition[]; unbekannteBaumarten: string[]; warnungen: string[] } {
  const positionen: RohPosition[] = []
  const unbekannteBaumarten: string[] = []
  const warnungen: string[] = []
  const ha = spez.flaecheHa ?? 0

  if (!(ha > 0)) {
    warnungen.push("Keine gültige Fläche — Mengen können nicht berechnet werden.")
  }

  const istPflanzung = spez.leistungsTyp === "pflanzung" || spez.leistungsTyp === "kombination"
  const istSaat = spez.leistungsTyp === "saat" || spez.leistungsTyp === "kombination"

  let pflanzenzahl = 0
  if (istPflanzung && ha > 0) {
    const verband = parsePflanzverband(spez.pflanzverband)
    pflanzenzahl = berechnePflanzenzahl(ha, verband.x, verband.y)
    const baumartLabel = spez.baumarten.length > 0 ? spez.baumarten.join(", ") : "Forstpflanzen"
    positionen.push({
      bezeichnung: `Pflanzgut ${baumartLabel}`,
      menge: pflanzenzahl,
      einheit: "stueck",
      quelle: "FORMEL",
      berechnungsFormel: `${ha} ha × 10000 / (${verband.x} × ${verband.y})`,
      konfidenz: 1,
    })

    if (spez.verbissschutz) {
      const schutzMenge = berechneVerbissschutz(
        pflanzenzahl,
        spez.verbissschutzTyp,
        opts.verbissPufferProzent
      )
      positionen.push({
        bezeichnung: `Verbissschutz (${spez.verbissschutzTyp})`,
        menge: schutzMenge,
        einheit: "stueck",
        quelle: "FORMEL",
        berechnungsFormel: `${pflanzenzahl} × (1 + ${opts.verbissPufferProzent}% Puffer)`,
        konfidenz: 1,
      })
    }
  }

  if (istSaat && ha > 0) {
    const baumarten = spez.baumarten.length > 0 ? spez.baumarten : ["unbekannt"]
    for (const ba of baumarten) {
      const saat = berechneSaatgut(ha, ba)
      if (saat.bekannt) {
        positionen.push({
          bezeichnung: `Saatgut ${ba}`,
          menge: saat.mengeKg,
          einheit: "kg",
          quelle: "FORMEL",
          berechnungsFormel: saat.anmerkung,
          konfidenz: 1,
        })
      } else {
        unbekannteBaumarten.push(ba)
        warnungen.push(`Saatgut-Richtwert für "${ba}" fehlt — ggf. KI-Schätzung/Manuell.`)
      }
    }
  }

  if (spez.zaun && ha > 0) {
    const zaunlaenge = berechneZaunlaenge(ha)
    positionen.push({
      bezeichnung: "Wildschutzzaun (Knotengeflecht)",
      menge: zaunlaenge,
      einheit: "lm",
      quelle: "FORMEL",
      berechnungsFormel: `Umfang Rechteck (v=1,5) aus ${ha} ha`,
      konfidenz: 0.9,
    })
    const pfaehle = berechnePfahlanzahl(zaunlaenge, opts.pfahlAbstandM)
    positionen.push({
      bezeichnung: "Zaunpfähle",
      menge: pfaehle,
      einheit: "stueck",
      quelle: "FORMEL",
      berechnungsFormel: `ceil(${zaunlaenge} lm / ${opts.pfahlAbstandM} m) + 1`,
      konfidenz: 0.9,
    })
  }

  return { positionen, unbekannteBaumarten, warnungen }
}

export interface BerechnungErgebnis {
  materialBedarfId: string
  positionenAnzahl: number
  gesamtKosten: number
  warnungen: string[]
}

/**
 * Hauptablauf: Spezifikation → Positionen → Lager-Abgleich → MaterialBedarf.
 * `llmFallback` ist optional und wird in Sprint 2 für unbekannte Baumarten genutzt.
 */
export async function berechneMaterialBedarf(
  rawSpez: unknown,
  opts: {
    angebotId?: string | null
    auftragId?: string | null
    userId?: string | null
    llmFallback?: (
      spez: MatInputSpezifikation,
      unbekannteBaumarten: string[]
    ) => Promise<{ positionen: RohPosition[]; kostenCent: number }>
  } = {}
): Promise<BerechnungErgebnis> {
  const spez = MatInputSpezifikationSchema.parse(rawSpez)
  const verbissPufferProzent = await getMatConfigNumber(MAT_CONFIG_KEYS.verbissPufferProzent, 5)
  const pfahlAbstandM = await getMatConfigNumber(MAT_CONFIG_KEYS.pfahlAbstandM, 3)
  const killSwitchAktiv = !(await isMatAgentAktiv())

  const det = baueDeterministischePositionen(spez, { verbissPufferProzent, pfahlAbstandM })
  let alleRoh: RohPosition[] = [...det.positionen]
  let llmKostenCent = 0

  if (opts.llmFallback && det.unbekannteBaumarten.length > 0) {
    try {
      const llm = await opts.llmFallback(spez, det.unbekannteBaumarten)
      alleRoh = alleRoh.concat(llm.positionen)
      llmKostenCent = llm.kostenCent
    } catch (e) {
      det.warnungen.push(`LLM-Fallback fehlgeschlagen: ${e instanceof Error ? e.message : "Fehler"}`)
    }
  }

  // Lager-Abgleich
  const bedarf: BedarfsPosition[] = alleRoh.map((p) => ({ bezeichnung: p.bezeichnung, menge: p.menge }))
  const abgleich = await gleicheAbLager(bedarf)

  // Kosten: nur tatsächlich zu bestellende Menge × Einkaufspreis
  let gesamtKosten = 0
  const positionenCreate = alleRoh.map((roh, i) => {
    const ab = abgleich.positionen[i]
    const einzelpreis = ab.einkaufspreis ?? null
    const gesamtpreis = einzelpreis != null ? Math.round(einzelpreis * ab.zuBestellenMenge * 100) / 100 : null
    if (gesamtpreis != null) gesamtKosten += gesamtpreis
    return {
      bezeichnung: roh.bezeichnung,
      menge: roh.menge,
      einheit: roh.einheit,
      einzelpreis,
      gesamtpreis,
      lagerArtikelId: ab.lagerArtikelId,
      lagerBestand: ab.lagerBestand,
      zuBestellenMenge: ab.zuBestellenMenge,
      berechnungsFormel: roh.berechnungsFormel,
      quelle: roh.quelle,
      konfidenz: roh.konfidenz,
      reihenfolge: i,
    }
  })
  gesamtKosten = Math.round(gesamtKosten * 100) / 100

  const bedarfRow = await prisma.materialBedarf.create({
    data: {
      angebotId: opts.angebotId ?? null,
      auftragId: opts.auftragId ?? null,
      inputSpezifikation: spez,
      lagerAbgleichJson: abgleich.uebersicht,
      gesamtKosten,
      llmKostenCent,
      status: alleRoh.length > 0 ? "BERECHNET" : "NEU",
      killSwitchAktiv,
      erstelltVon: opts.userId ?? null,
      positionen: { create: positionenCreate },
    },
  })

  // Bestellvorschläge (gruppiert nach Lieferant/Baumschule) erzeugen.
  await erzeugeBestellvorschlaege(bedarfRow.id)

  return {
    materialBedarfId: bedarfRow.id,
    positionenAnzahl: alleRoh.length,
    gesamtKosten,
    warnungen: det.warnungen,
  }
}
