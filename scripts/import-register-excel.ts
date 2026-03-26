import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'

// Lade .env
import { config } from 'dotenv'
config({ path: '/tmp/ka-forstmanager/.env' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const MEDIA_DIR = '/data/.openclaw/media/inbound'

// ────────────────────────────────────────────
// Hilfs-Funktionen
// ────────────────────────────────────────────

function str(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

/** DMS-String → Dezimalgrad (generisch) */
function dmsToDecimal(grad: number, min: number, sek: number): number {
  return grad + min / 60 + sek / 3600
}

/**
 * Bayern-Koordinate parsen: z.B. "49 °   46 ′   3,00 ″"
 * Gibt Dezimalgrad zurück oder null.
 */
function parseBayernKoord(raw: string): number | null {
  if (!raw) return null
  // Normalisiere Unicode-Sonderzeichen (° ′ ″) und Whitespace
  const s = raw
    .replace(/°/g, '°')
    .replace(/′/g, "'")
    .replace(/″/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

  // Pattern: Zahl ° Zahl ' Zahl,Zahl "
  const m = s.match(/^([\d]+)\s*°\s*([\d]+)\s*['′]\s*([\d,\.]+)\s*["″]?$/)
  if (!m) return null
  const grad = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const sek = parseFloat(m[3].replace(',', '.'))
  return dmsToDecimal(grad, min, sek)
}

/**
 * NW-FVA-Koordinate parsen: z.B. "51°57' N 9°46' O"
 * Gibt { lat, lon } zurück.
 */
function parseNwfvaKoord(raw: string): { lat: number | null; lon: number | null } {
  if (!raw) return { lat: null, lon: null }
  const s = str(raw)
  // Match: Grad°Min' N/S Grad°Min' O/W/E
  const m = s.match(/(\d+)°(\d+)'\s*[NS]\s+(\d+)°(\d+)'\s*[OWE]/)
  if (!m) return { lat: null, lon: null }
  const lat = dmsToDecimal(parseInt(m[1]), parseInt(m[2]), 0)
  const lon = dmsToDecimal(parseInt(m[3]), parseInt(m[4]), 0)
  return { lat, lon }
}

/**
 * Bayern Fläche parsen: "21,90   reduziert:   2,50"
 * Gibt { ha, redHa } zurück.
 */
function parseFlaecheBayern(raw: string): { ha: number | null; redHa: number | null } {
  if (!raw) return { ha: null, redHa: null }
  const s = str(raw).replace(/\s+/g, ' ')
  // Versuche "X,XX reduziert: Y,YY" oder "X,XX"
  const mFull = s.match(/([\d,\.]+)\s+reduziert:\s+([\d,\.]+)/i)
  if (mFull) {
    return {
      ha: parseFloat(mFull[1].replace(',', '.')),
      redHa: parseFloat(mFull[2].replace(',', '.')),
    }
  }
  const mSingle = s.match(/^([\d,\.]+)/)
  if (mSingle) {
    return { ha: parseFloat(mSingle[1].replace(',', '.')), redHa: null }
  }
  return { ha: null, redHa: null }
}

/**
 * Zulassung parsen: "von 09.09.2004   bis 31.12.2036" oder "von ... bis auf Widerruf"
 */
function parseZulassung(raw: string): {
  von: Date | null
  bis: Date | null
  bisText: string | null
} {
  if (!raw) return { von: null, bis: null, bisText: null }
  const s = str(raw).replace(/\s+/g, ' ')

  // Datum-Format DD.MM.YYYY
  function parseDE(d: string): Date | null {
    const m = d.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (!m) return null
    return new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`)
  }

  const mFull = s.match(/von\s+([\d\.]+)\s+bis\s+([\d\.]+)/i)
  if (mFull) {
    return { von: parseDE(mFull[1]), bis: parseDE(mFull[2]), bisText: null }
  }

  const mWiderruf = s.match(/von\s+([\d\.]+)\s+bis\s+(auf\s+Widerruf)/i)
  if (mWiderruf) {
    return { von: parseDE(mWiderruf[1]), bis: null, bisText: 'auf Widerruf' }
  }

  return { von: null, bis: null, bisText: s }
}

/**
 * NW-FVA Zulassung: Nur Jahr (z.B. "2043.0") oder "Zugelassen bis auf Widerruf"
 */
function parseNwfvaZulassung(raw: unknown): {
  bis: Date | null
  bisText: string | null
} {
  if (raw === null || raw === undefined) return { bis: null, bisText: null }
  const s = str(raw)
  if (/widerruf/i.test(s)) return { bis: null, bisText: 'auf Widerruf' }
  // Zahl (Jahr)
  const m = s.match(/(\d{4})/)
  if (m) {
    return { bis: new Date(`${m[1]}-12-31`), bisText: null }
  }
  return { bis: null, bisText: s || null }
}

/**
 * Ansprechpartner parsen (RLP):
 * "Name\n    \n    Tel.: 0172 123\n    \n    email@test.de"
 */
function parseAnsprechpartner(raw: string): {
  name: string
  tel: string | null
  email: string | null
} {
  if (!raw) return { name: '', tel: null, email: null }
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const name = lines[0] || ''
  let tel: string | null = null
  let email: string | null = null
  for (const line of lines) {
    if (/Tel\.?:/i.test(line)) {
      tel = line.replace(/Tel\.?:\s*/i, '').trim() || null
    }
    if (line.includes('@')) {
      email = line.trim()
    }
  }
  return { name, tel, email }
}

/** Fläche für NW-FVA / RLP (direkt numerisch) */
function parseFloatSafe(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  const s = str(val).replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// Statistik
const stats = { BY: 0, NW_FVA: 0, RLP: 0, errors: 0 }

// ────────────────────────────────────────────
// Format A: Bayern
// ────────────────────────────────────────────

async function importBayern(filePath: string, quelleId: string) {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Multi-Row: Suche Hauptzeilen (haben Register-Nr in Spalte Index 1)
  // Register-Nr sieht aus wie "BY-123-456" oder ähnliches mit Bindestrich/Nummer
  const entries: Array<{ main: unknown[]; sub1?: unknown[]; sub2?: unknown[] }> = []

  let i = 0
  while (i < rows.length) {
    const row = rows[i]
    const col1 = str(row[1])
    // Hauptzeile: hat Inhalt in Spalte 1 (Register-Nr), erkennbar an Buchstaben+Zahlen
    if (col1 && col1.length > 2 && /[A-Z0-9]/.test(col1)) {
      entries.push({
        main: row,
        sub1: rows[i + 1] || [],
        sub2: rows[i + 2] || [],
      })
      i += 3
    } else {
      i++
    }
  }

  console.log(`  Bayern (${path.basename(filePath)}): ${entries.length} Einträge gefunden`)

  for (const entry of entries) {
    try {
      const { main, sub1, sub2 } = entry
      const registerNr = str(main[1])
      if (!registerNr) continue

      const lat = parseBayernKoord(str(main[2]))
      const lon = parseBayernKoord(str(main[8]))
      const { ha, redHa } = parseFlaecheBayern(str(main[6]))
      const zulassung = parseZulassung(str(main[4]))

      // Höhe parsen: z.B. "300 - 600 m" oder "300 m"
      const hoeheRaw = str(main[10])
      let hoeheVon: number | null = null
      let hoeheBis: number | null = null
      const hoeheM = hoeheRaw.match(/(\d+)\s*[-–]\s*(\d+)/)
      if (hoeheM) {
        hoeheVon = parseInt(hoeheM[1])
        hoeheBis = parseInt(hoeheM[2])
      } else {
        const h = hoeheRaw.match(/(\d+)/)
        if (h) hoeheVon = parseInt(h[1])
      }

      // Baumart aus Hauptzeile Spalte 3 (erste Zeile oft Code+Text)
      const baumartRaw = str(main[3])
      // sub1 enthält oft den deutschen Namen
      const baumartName = str(sub1?.[3] || main[3])

      const existing = await prisma.registerFlaeche.findFirst({
        where: { quelleId, registerNr },
      })

      const data = {
        quelleId,
        registerNr,
        bundesland: 'Bayern',
        baumart: baumartName || baumartRaw || 'Unbekannt',
        baumartCode: baumartRaw || null,
        latDez: lat,
        lonDez: lon,
        koordinatenRaw: lat ? `${str(main[2])} / ${str(main[8])}` : null,
        flaecheHa: ha,
        flaecheRedHa: redHa,
        hoeheVon,
        hoeheBis,
        forstamt: str(main[0]) || null,
        revier: str(main[7]) || null,
        besitzart: str(main[9]) || null,
        zulassungVon: zulassung.von,
        zulassungBis: zulassung.bis,
        zulassungBisText: zulassung.bisText,
        quelleUrl: str(main[5]) || null,
        herkunftsgebiet: str(sub2?.[3]) || null,
        letzteAktualisierung: new Date(),
      }

      if (existing) {
        await prisma.registerFlaeche.update({ where: { id: existing.id }, data })
      } else {
        await prisma.registerFlaeche.create({ data })
      }
      stats.BY++
    } catch (e) {
      stats.errors++
      // console.error('BY Fehler:', e)
    }
  }
}

// ────────────────────────────────────────────
// Format B: NW-FVA
// ────────────────────────────────────────────

async function importNwFva(filePath: string, quelleId: string) {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Ab Zeile 2 (Index 1), Zeile 1 = Header
  const dataRows = rows.slice(1).filter((r) => str(r[1]).length > 2)
  console.log(`  NW-FVA (${path.basename(filePath)}): ${dataRows.length} Einträge gefunden`)

  for (const row of dataRows) {
    try {
      // Register-Nr aus Spalte 1
      const zulEinheit = str(row[1])
      let registerNr = zulEinheit
      const splitIdx = zulEinheit.indexOf('Zulassungseinheit ')
      if (splitIdx >= 0) {
        registerNr = zulEinheit.substring(splitIdx + 'Zulassungseinheit '.length).trim()
      }
      if (!registerNr) continue

      const { lat, lon } = parseNwfvaKoord(str(row[11]))
      const { bis, bisText } = parseNwfvaZulassung(row[0])

      // Höhenlage: z.B. "100 - 300" oder "bis 200"
      const hoeheRaw = str(row[14])
      let hoeheVon: number | null = null
      let hoeheBis: number | null = null
      const hM = hoeheRaw.match(/(\d+)\s*[-–]\s*(\d+)/)
      if (hM) {
        hoeheVon = parseInt(hM[1])
        hoeheBis = parseInt(hM[2])
      } else {
        const hS = hoeheRaw.match(/(\d+)/)
        if (hS) hoeheBis = parseInt(hS[1])
      }

      // Verkehrsbeschränkung
      const verkehr = str(row[16])
      const verkehrsbeschraenkung = /ja|yes|true|1/i.test(verkehr)

      // Zugelassen
      const zugelassenRaw = str(row[2])
      const zugelassen = !/nein|no|false/i.test(zugelassenRaw)

      // Erstes Jahr
      const erstesJahrRaw = str(row[17])
      const erstesJahrM = erstesJahrRaw.match(/(\d{4})/)
      const erstesJahr = erstesJahrM ? parseInt(erstesJahrM[1]) : null

      const existing = await prisma.registerFlaeche.findFirst({
        where: { quelleId, registerNr },
      })

      const data = {
        quelleId,
        registerNr,
        bundesland: str(row[9]) || 'Unbekannt',
        baumart: str(row[3]) || 'Unbekannt',
        herkunftCode: str(row[4]) || null,
        quelleUrl: str(row[5]) || null,
        eigentumsart: str(row[6]) || null,
        ausgangsmaterial: str(row[19]) || null,
        verwendungszweck: str(row[8]) || null,
        zulaessigeFlaechen: str(row[10]) || null,
        koordinatenRaw: str(row[11]) || null,
        latDez: lat,
        lonDez: lon,
        flaecheHa: parseFloatSafe(row[12]),
        flaecheRedHa: parseFloatSafe(row[13]),
        hoeheVon,
        hoeheBis,
        wuchsbezirk: str(row[15]) || null,
        verkehrsbeschraenkung,
        zugelassen,
        erstesJahr,
        herkunftsgebiet: str(row[18]) || null,
        hoheitlicheStelle: str(row[20]) || null,
        forstamt: str(row[21]) || null,
        landkreis: str(row[22]) || null,
        revier: str(row[23]) || null,
        zulassungBis: bis,
        zulassungBisText: bisText,
        letzteAktualisierung: new Date(),
      }

      if (existing) {
        await prisma.registerFlaeche.update({ where: { id: existing.id }, data })
      } else {
        await prisma.registerFlaeche.create({ data })
      }
      stats.NW_FVA++
    } catch (e) {
      stats.errors++
      // console.error('NWFVA Fehler:', e)
    }
  }
}

// ────────────────────────────────────────────
// Format C: RLP
// ────────────────────────────────────────────

async function importRlp(filePath: string, quelleId: string) {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  const dataRows = rows.slice(1).filter((r) => str(r[0]).length > 1)
  console.log(`  RLP (${path.basename(filePath)}): ${dataRows.length} Einträge gefunden`)

  for (const row of dataRows) {
    try {
      const registerNr = str(row[0])
      if (!registerNr) continue

      // Fläche: kann als Excel-Datum geparst werden → prüfe typeof
      let flaecheHa: number | null = null
      const flaecheRaw = row[7]
      if (typeof flaecheRaw === 'number') {
        flaecheHa = isNaN(flaecheRaw) ? null : flaecheRaw
      } else if (flaecheRaw) {
        flaecheHa = parseFloatSafe(flaecheRaw)
      }

      // Genetisch untersucht
      const genRaw = str(row[5])
      const genetischUntersucht = /ja|yes|true|1/i.test(genRaw)

      // Ansprechpartner
      const apRaw = str(row[12])
      const { name: apName, tel: apTel, email: apEmail } = parseAnsprechpartner(apRaw)

      const existing = await prisma.registerFlaeche.findFirst({
        where: { quelleId, registerNr },
      })

      const data = {
        quelleId,
        registerNr,
        bundesland: 'Rheinland-Pfalz',
        baumart: str(row[1]) || 'Unbekannt',
        herkunftsgebiet: str(row[2]) || null,
        kategorie: str(row[3]) || null,
        ausgangsmaterial: str(row[4]) || null,
        genetischUntersucht,
        alter: str(row[6]) || null,
        flaecheHa,
        latDez: null,
        lonDez: null,
        forstamt: str(row[8]) || null,
        revier: str(row[9]) || null,
        besitzart: str(row[10]) || null,
        hoheitlicheStelle: str(row[11]) || null,
        ansprechpartner: apName || null,
        ansprechpartnerTel: apTel,
        ansprechpartnerEmail: apEmail,
        letzteAktualisierung: new Date(),
      }

      if (existing) {
        await prisma.registerFlaeche.update({ where: { id: existing.id }, data })
      } else {
        await prisma.registerFlaeche.create({ data })
      }
      stats.RLP++
    } catch (e) {
      stats.errors++
      // console.error('RLP Fehler:', e)
    }
  }
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────

async function main() {
  console.log('=== Saatguternte Register-Import ===\n')

  // Quellen anlegen
  const byQuelle = await prisma.ernteRegisterQuelle.upsert({
    where: { kuerzel: 'BY' },
    update: {},
    create: {
      kuerzel: 'BY',
      name: 'Bayern Staatsministerium für Ernährung, Landwirtschaft und Forsten',
      bundeslaender: ['Bayern'],
      baseUrl: 'https://www.stmelf.bayern.de',
    },
  })

  const nwQuelle = await prisma.ernteRegisterQuelle.upsert({
    where: { kuerzel: 'NW-FVA' },
    update: {},
    create: {
      kuerzel: 'NW-FVA',
      name: 'Nordwestdeutsche Forstliche Versuchsanstalt',
      bundeslaender: ['Niedersachsen', 'Nordrhein-Westfalen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Hessen', 'Bremen', 'Hamburg', 'Thüringen'],
      baseUrl: 'https://www.nw-fva.de',
    },
  })

  const rlpQuelle = await prisma.ernteRegisterQuelle.upsert({
    where: { kuerzel: 'RLP' },
    update: {},
    create: {
      kuerzel: 'RLP',
      name: 'Erzeugerregister Rheinland-Pfalz',
      bundeslaender: ['Rheinland-Pfalz'],
      baseUrl: 'https://www.wald.rlp.de',
    },
  })

  console.log('Quellen angelegt:')
  console.log(`  BY: ${byQuelle.id}`)
  console.log(`  NW-FVA: ${nwQuelle.id}`)
  console.log(`  RLP: ${rlpQuelle.id}\n`)

  // Alle xlsx-Dateien einlesen
  if (!fs.existsSync(MEDIA_DIR)) {
    console.error(`MEDIA_DIR nicht gefunden: ${MEDIA_DIR}`)
    return
  }

  const files = fs.readdirSync(MEDIA_DIR).filter((f) => f.endsWith('.xlsx'))
  console.log(`Gefundene xlsx-Dateien: ${files.length}\n`)

  for (const file of files) {
    const filePath = path.join(MEDIA_DIR, file)

    if (file.startsWith('stmelf.bayern.de_')) {
      console.log(`→ Bayern: ${file}`)
      await importBayern(filePath, byQuelle.id)
    } else if (file.startsWith('nw-fva.de_')) {
      console.log(`→ NW-FVA: ${file}`)
      await importNwFva(filePath, nwQuelle.id)
    } else if (file.startsWith('EZR_') && file.includes('Rheinland-Pfalz')) {
      console.log(`→ RLP: ${file}`)
      await importRlp(filePath, rlpQuelle.id)
    } else {
      console.log(`  Übersprungen: ${file}`)
    }
  }

  console.log('\n=== Import-Statistik ===')
  console.log(`  Bayern (BY):  ${stats.BY} Einträge`)
  console.log(`  NW-FVA:       ${stats.NW_FVA} Einträge`)
  console.log(`  RLP:          ${stats.RLP} Einträge`)
  console.log(`  Gesamt:       ${stats.BY + stats.NW_FVA + stats.RLP} Einträge`)
  console.log(`  Fehler:       ${stats.errors}`)

  // DB-Zählung zur Verifikation
  const total = await prisma.registerFlaeche.count()
  console.log(`\n  DB-Gesamt RegisterFlaeche: ${total}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
