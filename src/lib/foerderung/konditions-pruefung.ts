/**
 * Conditional Logic Engine für Fördervoraussetzungen
 * Prüft ob ein Förderprogramm auf eine Anfrage passt
 */

export interface FoerderAnfrage {
  bundesland: string;
  waldtyp: 'privatwald' | 'koerperschaftswald' | 'staatswald';
  flaeche_ha: number;
  kalamitaet?: string;
  geplante_massnahmen?: string[];
  antrag_gestellt?: boolean; // true = Maßnahme bereits begonnen
  andere_eu_foerderung?: boolean;
}

export interface PruefErgebnis {
  programm_id: number;
  programm_name: string;
  passt: boolean;
  score: number; // 0-100
  gruende: string[];
  warnungen: string[];
  ausschlusskriterien: string[];
}

export function pruefeFoerderfaehigkeit(
  programm: Record<string, unknown>,
  anfrage: FoerderAnfrage
): PruefErgebnis {
  const gruende: string[] = [];
  const warnungen: string[] = [];
  const ausschlusskriterien: string[] = [];
  let score = 100;

  // 1. Bundesland-Check
  const bl = programm.bundesland as string;
  if (bl !== anfrage.bundesland && bl !== 'Bund' && bl !== 'EU') {
    ausschlusskriterien.push(`Programm gilt nur für ${bl}, nicht für ${anfrage.bundesland}`);
    return { programm_id: programm.id as number, programm_name: programm.name as string, passt: false, score: 0, gruende, warnungen, ausschlusskriterien };
  }
  gruende.push(`✅ Gilt für ${anfrage.bundesland}`);

  // 2. Mindestfläche-Check
  if (programm.mindestflaeche_ha && anfrage.flaeche_ha < (programm.mindestflaeche_ha as number)) {
    ausschlusskriterien.push(`Mindestfläche ${programm.mindestflaeche_ha} ha nicht erreicht (Sie haben ${anfrage.flaeche_ha} ha)`);
    return { programm_id: programm.id as number, programm_name: programm.name as string, passt: false, score: 0, gruende, warnungen, ausschlusskriterien };
  }
  if (anfrage.flaeche_ha >= 1) gruende.push(`✅ Fläche ${anfrage.flaeche_ha} ha ausreichend`);

  // 3. Waldbesitzart-Check
  const waldbesitzart = programm.waldbesitzart as string[] | null;
  if (waldbesitzart && waldbesitzart.length > 0) {
    if (!waldbesitzart.includes(anfrage.waldtyp) && !waldbesitzart.includes('alle')) {
      ausschlusskriterien.push(`Programm gilt nur für: ${waldbesitzart.join(', ')}`);
      return { programm_id: programm.id as number, programm_name: programm.name as string, passt: false, score: 0, gruende, warnungen, ausschlusskriterien };
    }
  }
  gruende.push(`✅ Waldbesitzart ${anfrage.waldtyp} förderfähig`);

  // 4. EU-Kumulierungs-Check
  if (anfrage.andere_eu_foerderung) {
    const kategorien = programm.kategorien as string[] | null;
    if (kategorien?.includes('eu-kofinanziert')) {
      score -= 30;
      warnungen.push(`⚠️ Kombination mit anderer EU-Förderung prüfen — Kumulierungsverbot möglich`);
    }
  }

  // 5. Maßnahmen-vor-Antrag-Check
  if (anfrage.antrag_gestellt === false) {
    gruende.push(`✅ Antrag vor Maßnahmenbeginn — Grundvoraussetzung erfüllt`);
  } else if (anfrage.antrag_gestellt === true) {
    score -= 50;
    warnungen.push(`⚠️ Kritisch: Maßnahme bereits begonnen — die meisten Programme fördern nur ungestartete Maßnahmen!`);
  }

  // 6. Kalamitäts-Bonus
  if (anfrage.kalamitaet) {
    const kategorien = programm.kategorien as string[] | null;
    if (kategorien?.includes('wiederbewaldung') || kategorien?.includes('waldschutz')) {
      score = Math.min(100, score + 10);
      gruende.push(`✅ Kalamitätshilfe-Programm — passt zur Situation`);
    }
  }

  return {
    programm_id: programm.id as number,
    programm_name: programm.name as string,
    passt: score >= 60 && ausschlusskriterien.length === 0,
    score,
    gruende,
    warnungen,
    ausschlusskriterien
  };
}
