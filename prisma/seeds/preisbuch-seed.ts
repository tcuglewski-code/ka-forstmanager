/**
 * A1 Angebots-Agent — Sprint 0: Preisbuch Seed-Daten
 *
 * Realistische Mock-Preise für einen Forstbetrieb (DE 2025). Vor dem
 * Produktiveinsatz müssen echte Koch-Aufforstung-Preise unter /admin/preisbuch
 * gepflegt werden.
 *
 * Idempotent: Kategorien/Aufschläge/Templates werden über eindeutige Namen
 * upgesertet; Einträge über (Kategorie + Bezeichnung).
 *
 * Ausführen:
 *   DATABASE_URL=... npx tsx prisma/seeds/preisbuch-seed.ts
 */
import { PrismaClient, type PreisbuchEinheit, type AufschlagTyp } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type EintragSeed = {
  bezeichnung: string;
  einheit: PreisbuchEinheit;
  basispreis: number;
  mwstSatz: number;
  lieferantTyp?: string;
  beschreibung?: string;
};

const KATEGORIEN: {
  name: string;
  label: string;
  beschreibung: string;
  reihenfolge: number;
  eintraege: EintragSeed[];
}[] = [
  {
    name: "aufforstung",
    label: "Aufforstung/Pflanzung",
    beschreibung: "Pflanzarbeiten nach Verband, inkl. Pflanzleistung",
    reihenfolge: 1,
    eintraege: [
      { bezeichnung: "Pflanzung Laubholz Standard", einheit: "stueck", basispreis: 0.85, mwstSatz: 19, lieferantTyp: "EIGEN", beschreibung: "Pflanzleistung Laubholz im Lochpflanzverfahren" },
      { bezeichnung: "Pflanzung Nadelholz Standard", einheit: "stueck", basispreis: 0.65, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Pflanzung Großpflanze (Ballenware)", einheit: "stueck", basispreis: 4.5, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Pflanzung Premium (Setzstab + Anwuchskontrolle)", einheit: "stueck", basispreis: 1.2, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "kulturpflege",
    label: "Kulturpflege",
    beschreibung: "Freistellen, Läuterung, Mähen, Mulchen",
    reihenfolge: 2,
    eintraege: [
      { bezeichnung: "Freistellen / Freischneiden", einheit: "ha", basispreis: 450, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Läuterung", einheit: "ha", basispreis: 380, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Mulchen (Pflegegang)", einheit: "ha", basispreis: 520, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Mähen motormanuell", einheit: "ha", basispreis: 410, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "flaechenvorbereitung",
    label: "Flächenvorbereitung",
    beschreibung: "Räumen, Mulchen, Bodenbearbeitung vor der Pflanzung",
    reihenfolge: 3,
    eintraege: [
      { bezeichnung: "Flächenmulchen vor Pflanzung", einheit: "ha", basispreis: 980, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Räumung Schlagabraum", einheit: "ha", basispreis: 1200, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Bodenbearbeitung (Streifen)", einheit: "ha", basispreis: 850, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "zaunbau",
    label: "Zaunbau",
    beschreibung: "Wildschutzzaun inkl. Material und Pfosten",
    reihenfolge: 4,
    eintraege: [
      { bezeichnung: "Rehwildschutzzaun (Knotengeflecht 1,60m)", einheit: "lm", basispreis: 8.5, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Rotwildschutzzaun (2,00m)", einheit: "lm", basispreis: 13.5, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Zaunpfosten Akazie", einheit: "stueck", basispreis: 3.2, mwstSatz: 19, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Zaunabbau / Rückbau", einheit: "lm", basispreis: 3.8, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "verbissschutz",
    label: "Verbissschutz",
    beschreibung: "Einzelschutz: Wuchshüllen, Spiralen, Drahthosen",
    reihenfolge: 5,
    eintraege: [
      { bezeichnung: "Wuchshülle Einzelschutz (120cm)", einheit: "stueck", basispreis: 1.8, mwstSatz: 19, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Verbissspirale", einheit: "stueck", basispreis: 0.85, mwstSatz: 19, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Drahthose", einheit: "stueck", basispreis: 2.4, mwstSatz: 19, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Stützstab (Bambus/Holz)", einheit: "stueck", basispreis: 0.45, mwstSatz: 19, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Montage Einzelschutz", einheit: "stueck", basispreis: 0.9, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "pflanzgut",
    label: "Pflanzenbeschaffung",
    beschreibung: "Baumschulware nach Art/Sortierung (7% USt — Lieferung)",
    reihenfolge: 6,
    eintraege: [
      { bezeichnung: "Stiel-Eiche 1+0 (50-80cm)", einheit: "stueck", basispreis: 0.95, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Rotbuche 2+0 (50-80cm)", einheit: "stueck", basispreis: 0.7, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Bergahorn 1+1 (80-120cm)", einheit: "stueck", basispreis: 0.85, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Vogelkirsche 1+1 (80-120cm)", einheit: "stueck", basispreis: 1.1, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Winterlinde 1+1 (80-120cm)", einheit: "stueck", basispreis: 0.95, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Douglasie 2+1 (30-50cm)", einheit: "stueck", basispreis: 0.6, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Weißtanne 2+2 (30-50cm)", einheit: "stueck", basispreis: 0.75, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Fichte 2+1 (30-50cm)", einheit: "stueck", basispreis: 0.4, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Lärche 1+1 (50-80cm)", einheit: "stueck", basispreis: 0.65, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Kiefer 1+0 (20-40cm)", einheit: "stueck", basispreis: 0.35, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Hainbuche 1+1 (80-120cm)", einheit: "stueck", basispreis: 0.8, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Esskastanie 1+1 (80-120cm)", einheit: "stueck", basispreis: 1.4, mwstSatz: 7, lieferantTyp: "MATERIAL" },
    ],
  },
  {
    name: "saatgut",
    label: "Saatgut / Saatguternte",
    beschreibung: "Saatgutgewinnung und -lieferung nach Baumart",
    reihenfolge: 7,
    eintraege: [
      { bezeichnung: "Saatgut Eiche", einheit: "kg", basispreis: 12, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Saatgut Buche", einheit: "kg", basispreis: 8, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Saatgut Fichte", einheit: "kg", basispreis: 45, mwstSatz: 7, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Saatguternte (Sammelleistung)", einheit: "stunde", basispreis: 52, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Saatgutaufbereitung", einheit: "kg", basispreis: 6, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "personal",
    label: "Personalleistung",
    beschreibung: "Stundensätze nach Qualifikation",
    reihenfolge: 8,
    eintraege: [
      { bezeichnung: "Forstwirt / Facharbeiter", einheit: "stunde", basispreis: 58, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Vorarbeiter", einheit: "stunde", basispreis: 72, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Maschinenführer", einheit: "stunde", basispreis: 95, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Hilfskraft", einheit: "stunde", basispreis: 38, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "maschinen",
    label: "Maschineneinsatz",
    beschreibung: "Maschinenstunden inkl. Betriebsstoffe",
    reihenfolge: 9,
    eintraege: [
      { bezeichnung: "Forstmulcher (Bagger-Anbau)", einheit: "stunde", basispreis: 150, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Bagger 8t", einheit: "stunde", basispreis: 110, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Pflanzmaschine", einheit: "stunde", basispreis: 135, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Freischneider motormanuell", einheit: "stunde", basispreis: 65, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "anfahrt",
    label: "Anfahrt / Sonstiges",
    beschreibung: "Pauschalen für An-/Abfahrt und Kleinmaterial",
    reihenfolge: 10,
    eintraege: [
      { bezeichnung: "Anfahrtspauschale (<50km)", einheit: "pauschale", basispreis: 150, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Anfahrtspauschale (>50km)", einheit: "pauschale", basispreis: 280, mwstSatz: 19, lieferantTyp: "EIGEN" },
      { bezeichnung: "Kleinmaterial-Pauschale", einheit: "pauschale", basispreis: 90, mwstSatz: 19, lieferantTyp: "MATERIAL" },
      { bezeichnung: "Baustelleneinrichtung", einheit: "pauschale", basispreis: 320, mwstSatz: 19, lieferantTyp: "EIGEN" },
    ],
  },
  {
    name: "fremdleistung",
    label: "Fremdleistung / Subunternehmer",
    beschreibung: "Zugekaufte Leistungen (inkl. Subunternehmer-Aufschlag)",
    reihenfolge: 11,
    eintraege: [
      { bezeichnung: "Subunternehmer Pflanzung", einheit: "stueck", basispreis: 1.05, mwstSatz: 19, lieferantTyp: "FREMDLEISTUNG" },
      { bezeichnung: "Subunternehmer Zaunbau", einheit: "lm", basispreis: 10.5, mwstSatz: 19, lieferantTyp: "FREMDLEISTUNG" },
    ],
  },
];

const AUFSCHLAEGE: {
  name: string;
  typ: AufschlagTyp;
  bedingung: Record<string, unknown>;
  faktor: number;
  beschreibung: string;
  reihenfolge: number;
}[] = [
  { name: "Steilhang 10-25%", typ: "steilheit", bedingung: { min: 10, max: 25 }, faktor: 0.15, beschreibung: "+15% bei mittlerer Hangneigung", reihenfolge: 1 },
  { name: "Steilhang 25-35%", typ: "steilheit", bedingung: { min: 25, max: 35 }, faktor: 0.3, beschreibung: "+30% bei starker Hangneigung", reihenfolge: 2 },
  { name: "Steilhang >35%", typ: "steilheit", bedingung: { min: 35, max: 999 }, faktor: 0.5, beschreibung: "+50% bei extremer Hangneigung", reihenfolge: 3 },
  { name: "Entfernung 50-100km", typ: "entfernung", bedingung: { min: 50, max: 100 }, faktor: 0.1, beschreibung: "+10% Anfahrt mittel", reihenfolge: 4 },
  { name: "Entfernung >100km", typ: "entfernung", bedingung: { min: 100, max: 9999 }, faktor: 0.2, beschreibung: "+20% Anfahrt weit", reihenfolge: 5 },
  { name: "Saison Winter (Nov-Feb)", typ: "saison", bedingung: { wert: "winter" }, faktor: 0.08, beschreibung: "+8% Erschwernis Winterpflanzung", reihenfolge: 6 },
  { name: "Subunternehmer-Aufschlag", typ: "subunternehmer", bedingung: { wert: "fremdleistung" }, faktor: 0.25, beschreibung: "+25% Koordination/Marge", reihenfolge: 7 },
  { name: "Mengenrabatt >10ha", typ: "menge", bedingung: { min: 10, max: 99999 }, faktor: -0.05, beschreibung: "-5% ab 10 ha Fläche", reihenfolge: 8 },
  { name: "Boden steinig", typ: "bodenart", bedingung: { wert: "steinig" }, faktor: 0.1, beschreibung: "+10% steiniger Boden", reihenfolge: 9 },
  { name: "Boden nass/moorig", typ: "bodenart", bedingung: { wert: "nass" }, faktor: 0.2, beschreibung: "+20% nasser/mooriger Boden", reihenfolge: 10 },
];

const TEMPLATES: {
  name: string;
  beschreibung: string;
  leistungsTyp: string;
  positionenJson: unknown;
  berechnungsLogikJson: unknown;
  reihenfolge: number;
}[] = [
  {
    name: "Erstaufforstung Laubholz",
    beschreibung: "Komplette Laubholz-Erstaufforstung mit Einzelschutz",
    leistungsTyp: "erstaufforstung_laub",
    reihenfolge: 1,
    positionenJson: [
      { kategorieName: "flaechenvorbereitung", eintragName: "Flächenmulchen vor Pflanzung", mengenFormel: "flaeche", optional: true, beschreibung: "Flächenvorbereitung" },
      { kategorieName: "pflanzgut", eintragName: "Stiel-Eiche 1+0 (50-80cm)", mengenFormel: "baumanzahl", optional: false, beschreibung: "Pflanzgut Laubholz" },
      { kategorieName: "aufforstung", eintragName: "Pflanzung Laubholz Standard", mengenFormel: "baumanzahl", optional: false, beschreibung: "Pflanzleistung" },
      { kategorieName: "verbissschutz", eintragName: "Wuchshülle Einzelschutz (120cm)", mengenFormel: "baumanzahl", optional: true, beschreibung: "Verbissschutz" },
      { kategorieName: "verbissschutz", eintragName: "Montage Einzelschutz", mengenFormel: "baumanzahl", optional: true },
      { kategorieName: "zaunbau", eintragName: "Rehwildschutzzaun (Knotengeflecht 1,60m)", mengenFormel: "zaunlaenge", optional: true, beschreibung: "Flächenschutz" },
      { kategorieName: "anfahrt", eintragName: "Anfahrtspauschale (<50km)", mengenFormel: "1", optional: false },
    ],
    berechnungsLogikJson: { formeln: { baumanzahl: "flaecheHa * pflanzverbandDichte", zaunlaenge: "umfang_aus_flaeche" }, hinweis: "Pflanzverband Standard 2500 Stk/ha" },
  },
  {
    name: "Erstaufforstung Nadelholz",
    beschreibung: "Nadelholz-Erstaufforstung mit Wuchshüllen",
    leistungsTyp: "erstaufforstung_nadel",
    reihenfolge: 2,
    positionenJson: [
      { kategorieName: "pflanzgut", eintragName: "Douglasie 2+1 (30-50cm)", mengenFormel: "baumanzahl", optional: false },
      { kategorieName: "aufforstung", eintragName: "Pflanzung Nadelholz Standard", mengenFormel: "baumanzahl", optional: false },
      { kategorieName: "verbissschutz", eintragName: "Verbissspirale", mengenFormel: "baumanzahl", optional: true },
      { kategorieName: "anfahrt", eintragName: "Anfahrtspauschale (<50km)", mengenFormel: "1", optional: false },
    ],
    berechnungsLogikJson: { formeln: { baumanzahl: "flaecheHa * pflanzverbandDichte" }, hinweis: "Nadelholz-Verband i.d.R. dichter" },
  },
  {
    name: "Kulturpflege Freistellen",
    beschreibung: "Pflegegang Freistellen + Läuterung",
    leistungsTyp: "kulturpflege",
    reihenfolge: 3,
    positionenJson: [
      { kategorieName: "kulturpflege", eintragName: "Freistellen / Freischneiden", mengenFormel: "flaeche", optional: false },
      { kategorieName: "kulturpflege", eintragName: "Läuterung", mengenFormel: "flaeche", optional: true },
      { kategorieName: "anfahrt", eintragName: "Anfahrtspauschale (<50km)", mengenFormel: "1", optional: false },
    ],
    berechnungsLogikJson: { formeln: { flaeche: "flaecheHa" } },
  },
  {
    name: "Saatgutnutzung",
    beschreibung: "Saatguternte + Aufbereitung + Lieferung",
    leistungsTyp: "saatgut",
    reihenfolge: 4,
    positionenJson: [
      { kategorieName: "saatgut", eintragName: "Saatguternte (Sammelleistung)", mengenFormel: "stunden", optional: false },
      { kategorieName: "saatgut", eintragName: "Saatgutaufbereitung", mengenFormel: "menge_kg", optional: true },
      { kategorieName: "anfahrt", eintragName: "Anfahrtspauschale (<50km)", mengenFormel: "1", optional: false },
    ],
    berechnungsLogikJson: { formeln: { stunden: "schaetzung", menge_kg: "schaetzung" }, hinweis: "Mengen werden vom GF im Review präzisiert" },
  },
  {
    name: "Kombinationsauftrag",
    beschreibung: "Pflanzung + Pflege + Zaun komplett",
    leistungsTyp: "kombination",
    reihenfolge: 5,
    positionenJson: [
      { kategorieName: "flaechenvorbereitung", eintragName: "Flächenmulchen vor Pflanzung", mengenFormel: "flaeche", optional: true },
      { kategorieName: "pflanzgut", eintragName: "Rotbuche 2+0 (50-80cm)", mengenFormel: "baumanzahl", optional: false },
      { kategorieName: "aufforstung", eintragName: "Pflanzung Laubholz Standard", mengenFormel: "baumanzahl", optional: false },
      { kategorieName: "zaunbau", eintragName: "Rehwildschutzzaun (Knotengeflecht 1,60m)", mengenFormel: "zaunlaenge", optional: false },
      { kategorieName: "kulturpflege", eintragName: "Freistellen / Freischneiden", mengenFormel: "flaeche", optional: true },
      { kategorieName: "anfahrt", eintragName: "Anfahrtspauschale (>50km)", mengenFormel: "1", optional: false },
    ],
    berechnungsLogikJson: { formeln: { baumanzahl: "flaecheHa * pflanzverbandDichte", zaunlaenge: "umfang_aus_flaeche" } },
  },
];

async function main() {
  let katCount = 0;
  let eintragCount = 0;

  for (const kat of KATEGORIEN) {
    const kategorie = await prisma.preisbuchKategorie.upsert({
      where: { name: kat.name },
      update: { label: kat.label, beschreibung: kat.beschreibung, reihenfolge: kat.reihenfolge, aktiv: true },
      create: { name: kat.name, label: kat.label, beschreibung: kat.beschreibung, reihenfolge: kat.reihenfolge },
    });
    katCount++;

    let r = 0;
    for (const e of kat.eintraege) {
      r++;
      const existing = await prisma.preisbuchEintrag.findFirst({
        where: { kategorieId: kategorie.id, bezeichnung: e.bezeichnung },
      });
      const data = {
        kategorieId: kategorie.id,
        bezeichnung: e.bezeichnung,
        einheit: e.einheit,
        basispreis: e.basispreis,
        mwstSatz: e.mwstSatz,
        lieferantTyp: e.lieferantTyp ?? null,
        beschreibung: e.beschreibung ?? null,
        reihenfolge: r,
        aktiv: true,
      };
      if (existing) {
        await prisma.preisbuchEintrag.update({ where: { id: existing.id }, data });
      } else {
        await prisma.preisbuchEintrag.create({ data });
      }
      eintragCount++;
    }
  }

  // Aufschläge (global, eintragId=null)
  for (const a of AUFSCHLAEGE) {
    const existing = await prisma.preisbuchAufschlag.findFirst({ where: { name: a.name } });
    const data = {
      name: a.name,
      typ: a.typ,
      bedingung: a.bedingung,
      faktor: a.faktor,
      beschreibung: a.beschreibung,
      reihenfolge: a.reihenfolge,
      aktiv: true,
      eintragId: null,
    };
    if (existing) {
      await prisma.preisbuchAufschlag.update({ where: { id: existing.id }, data });
    } else {
      await prisma.preisbuchAufschlag.create({ data });
    }
  }

  // Templates
  for (const t of TEMPLATES) {
    const existing = await prisma.kalkulationsTemplate.findFirst({ where: { name: t.name } });
    const data = {
      name: t.name,
      beschreibung: t.beschreibung,
      leistungsTyp: t.leistungsTyp,
      positionenJson: t.positionenJson as object,
      berechnungsLogikJson: t.berechnungsLogikJson as object,
      reihenfolge: t.reihenfolge,
      aktiv: true,
    };
    if (existing) {
      await prisma.kalkulationsTemplate.update({ where: { id: existing.id }, data });
    } else {
      await prisma.kalkulationsTemplate.create({ data });
    }
  }

  console.log(
    `[preisbuch-seed] OK: ${katCount} Kategorien, ${eintragCount} Einträge, ${AUFSCHLAEGE.length} Aufschläge, ${TEMPLATES.length} Templates`
  );
}

main()
  .catch((e) => {
    console.error("[preisbuch-seed] Fehler:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
