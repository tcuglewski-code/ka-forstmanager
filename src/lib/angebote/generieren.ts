/**
 * A1 — Angebots-Generierung Orchestrierung (ANG-020)
 * Verkettet: Parser → Kalkulation → RAG → Draft + Angebots-Entwurf.
 * Alle KI-Schritte werden auditiert (promptHash, Kosten). Deterministische
 * Kalkulation bleibt LLM-frei (NEVER #23).
 */
import { prisma } from "@/lib/prisma"
import type { PreisbuchEinheit } from "@prisma/client"
import { parseAnfrage, type InputTyp } from "@/lib/angebote/parsing/anfrage-parser"
import { ladePreisbuchKontext } from "@/lib/angebote/kalkulation/preisbuch-query"
import { kalkuliereAngebot } from "@/lib/angebote/kalkulation/rechner"
import { findeAehnlicheAuftraege } from "@/lib/angebote/rag/historische-auftraege"
import { isAgentAktiv } from "@/lib/angebote/config"

export interface GenerierungsErgebnis {
  angebotId: string
  draftId: string
  templateName: string | null
  gesamtNetto: number
  gesamtBrutto: number
  konfidenz: number
  warnungen: string[]
  rueckfragen: string[]
}

/** Hauptablauf. Wirft bei DB-Fehlern; Parser/RAG sind in sich abgesichert. */
export async function generiereAngebot(
  roheAnfrage: string,
  inputTyp: InputTyp,
  userId: string | null
): Promise<GenerierungsErgebnis> {
  const killSwitchAktiv = !(await isAgentAktiv())

  // 1) Draft anlegen
  const draft = await prisma.angebotsDraft.create({
    data: { roheAnfrage, inputTyp, status: "PARSING", erstelltVon: userId },
  })

  // 2) Parsen (LLM, abgesichert)
  const parse = await parseAnfrage(roheAnfrage, inputTyp, userId)
  const spez = parse.spezifikation

  // 3) Deterministische Kalkulation
  const kontext = await ladePreisbuchKontext()
  const { details, templateName } = kalkuliereAngebot(spez, kontext)

  // 4) RAG: historische Vergleichsaufträge
  const vergleich = await findeAehnlicheAuftraege(spez, 3)

  await prisma.angebotsDraft.update({
    where: { id: draft.id },
    data: { geparsteSpezifikation: spez, status: "BEREIT" },
  })

  // 5) Angebots-Entwurf + Positionen + Audit (Transaktion)
  const nummer = await naechsteNummer()
  const angebot = await prisma.angebot.create({
    data: {
      nummer,
      draftId: draft.id,
      status: "entwurf",
      kiGeneriert: true,
      kiGeneriertAm: new Date(),
      kiKostenCent: parse.kostenCent,
      kiModell: parse.modell,
      killSwitchAktiv,
      flaeche_ha: spez.flaeche,
      beschreibung: templateName ?? null,
      anfrageSpezifikationJson: spez,
      vergleichsAuftraegeJson: vergleich,
      mwstSatz: 19,
      gesamtNetto: details.gesamtNetto,
      gesamtpreis: details.gesamtBrutto,
      mwstBetrag: details.mwstBetrag,
      createdById: userId,
      positionen: {
        create: details.positionen.map((p, i) => ({
          bezeichnung: p.bezeichnung,
          menge: p.menge,
          einheit: p.einheit as PreisbuchEinheit,
          einzelpreis: p.einzelpreis,
          aufschlaegeJson: p.aufschlaege,
          gesamtpreis: p.gesamtpreis,
          mwstSatz: p.mwstSatz,
          preisbuchId: p.preisbuchId,
          quelle: p.quelle,
          konfidenz: p.konfidenz,
          reihenfolge: i,
        })),
      },
      audits: {
        create: [
          {
            schritt: "parsing",
            modell: parse.modell,
            kostenCent: parse.kostenCent,
            detailsJson: { konfidenz: spez.konfidenz, rueckfragen: spez.rueckfragenErforderlich },
            erstelltVon: userId,
          },
          {
            schritt: "kalkulation",
            detailsJson: {
              template: templateName,
              positionen: details.positionen.length,
              warnungen: details.warnungen,
            },
            erstelltVon: userId,
          },
          {
            schritt: "rag",
            detailsJson: { vergleichsAuftraege: vergleich.length },
            erstelltVon: userId,
          },
        ],
      },
    },
  })

  return {
    angebotId: angebot.id,
    draftId: draft.id,
    templateName,
    gesamtNetto: details.gesamtNetto,
    gesamtBrutto: details.gesamtBrutto,
    konfidenz: details.konfidenz,
    warnungen: details.warnungen,
    rueckfragen: spez.rueckfragenErforderlich,
  }
}

async function naechsteNummer(): Promise<string> {
  const year = new Date().getFullYear()
  const alle = await prisma.angebot.findMany({
    where: { nummer: { startsWith: `AN-${year}-` } },
    select: { nummer: true },
  })
  let max = 0
  for (const a of alle) {
    const m = a.nummer?.match(/^AN-\d{4}-(\d{4})$/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  let next = max + 1
  let nummer = `AN-${year}-${String(next).padStart(4, "0")}`
  while (await prisma.angebot.findUnique({ where: { nummer } })) {
    next++
    nummer = `AN-${year}-${String(next).padStart(4, "0")}`
  }
  return nummer
}
