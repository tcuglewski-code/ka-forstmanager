// FM-12: Smart Items — vordefinierte Leistungspositionen nach Dienstleistungstyp
// Verknüpft mit den WP-Wizard-Dienstleistungen

export interface SmartItem {
  name: string
  einheit: string
  richtwert: number
}

export const SMART_ITEMS_BY_DIENSTLEISTUNG: Record<string, SmartItem[]> = {
  pflanzung: [
    { name: "Pflanzung Nadelholz", einheit: "Stück", richtwert: 50 },
    { name: "Pflanzung Laubholz", einheit: "Stück", richtwert: 40 },
    { name: "Wildschutzrohr setzen", einheit: "Stück", richtwert: 80 },
    { name: "Wuchshülle setzen", einheit: "Stück", richtwert: 60 },
    { name: "Pflanzlochbohrung", einheit: "Stück", richtwert: 100 },
  ],
  kulturschutz: [
    { name: "Zaunbau Einzelschutz", einheit: "Stück", richtwert: 100 },
    { name: "Flächenschutz Zaun", einheit: "m", richtwert: 150 },
    { name: "Zaunabbau", einheit: "m", richtwert: 200 },
    { name: "Fegeschutz anbringen", einheit: "Stück", richtwert: 120 },
  ],
  flaechenvorbereitung: [
    { name: "Bodenvorbereitung", einheit: "ha", richtwert: 2 },
    { name: "Freischneider-Einsatz", einheit: "h", richtwert: 6 },
    { name: "Mulchen", einheit: "ha", richtwert: 3 },
    { name: "Rodung / Stubbenroden", einheit: "ha", richtwert: 1 },
  ],
  pflege: [
    { name: "Pflegeschnitt", einheit: "Stück", richtwert: 200 },
    { name: "Mäharbeiten", einheit: "ha", richtwert: 3 },
    { name: "Kultur-Nachbesserung", einheit: "Stück", richtwert: 30 },
    { name: "Läuterung", einheit: "ha", richtwert: 2 },
  ],
  saatguternte: [
    { name: "Saatguternte", einheit: "kg", richtwert: 10 },
    { name: "Zapfenernte", einheit: "kg", richtwert: 5 },
    { name: "Stecklingsschnitt", einheit: "Stück", richtwert: 200 },
  ],
}

export const DIENSTLEISTUNG_LABELS: Record<string, string> = {
  pflanzung: "Pflanzung",
  kulturschutz: "Kulturschutz / Zaunbau",
  flaechenvorbereitung: "Flächenvorbereitung",
  pflege: "Pflege",
  saatguternte: "Saatguternte",
}

export function getSmartItemsForDienstleistung(dienstleistung: string): SmartItem[] {
  const key = dienstleistung.toLowerCase().trim()
  // Direct match
  if (SMART_ITEMS_BY_DIENSTLEISTUNG[key]) return SMART_ITEMS_BY_DIENSTLEISTUNG[key]
  // Fuzzy match
  for (const [k, items] of Object.entries(SMART_ITEMS_BY_DIENSTLEISTUNG)) {
    if (key.includes(k) || k.includes(key)) return items
  }
  // Map common aliases
  if (key.includes("zaun")) return SMART_ITEMS_BY_DIENSTLEISTUNG.kulturschutz
  if (key.includes("saat") || key.includes("ernte")) return SMART_ITEMS_BY_DIENSTLEISTUNG.saatguternte
  if (key.includes("pflanz")) return SMART_ITEMS_BY_DIENSTLEISTUNG.pflanzung
  if (key.includes("pflege") || key.includes("mäh")) return SMART_ITEMS_BY_DIENSTLEISTUNG.pflege
  if (key.includes("boden") || key.includes("freischn") || key.includes("mulch")) return SMART_ITEMS_BY_DIENSTLEISTUNG.flaechenvorbereitung
  return []
}
