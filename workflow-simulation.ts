/**
 * Workflow-Simulation: WP-Anfragen → ForstManager Aufträge → Tagesprotokolle
 * Verwendet exakte Tagesprotokoll-Felder aus der Screenshot-Analyse (2026-03-27)
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = 'postgresql://neondb_owner:npg_fDBsFc9Tjdy1@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/ForstManagerKADB?sslmode=require'
process.env.DATABASE_URL = DB_URL

const adapter = new PrismaPg({ connectionString: DB_URL })
const prisma = new PrismaClient({ adapter })

const WP_BASE = 'https://peru-otter-113714.hostingersite.com/wp-json/ka/v1'
const WP_AUTH = 'Basic ' + Buffer.from('openclaw:aZ*rd^)AHcUZiY9F39#yHYHI').toString('base64')

// Realistische WP-Anfragen für die Simulation
const ANFRAGEN_DEMO = [
  {
    name: 'Klaus Hoffmann',
    email: 'hoffmann.wald@example.de',
    telefon: '0761-4521890',
    flaeche_ha: 3.8,
    baumarten: 'Eiche, Buche, Vogelkirsche',
    standort: 'Schwarzwaldkreis, Baden-Württemberg',
    bundesland: 'Baden-Württemberg',
    lat: 48.1234,
    lng: 8.2345,
    beschreibung: 'Aufforstung nach Borkenkäferkalamität. Mischbestand gewünscht.',
    forstamt: 'Forstamt Freudenstadt',
    revier: 'Revier Nordschwarzwald',
  },
  {
    name: 'Ingrid Bauer',
    email: 'i.bauer@beispiel.de',
    telefon: '089-7832456',
    flaeche_ha: 2.1,
    baumarten: 'Fichte, Tanne, Kiefer',
    standort: 'Landkreis Miesbach, Bayern',
    bundesland: 'Bayern',
    lat: 47.7891,
    lng: 11.9012,
    beschreibung: 'Wiederaufforstung Windwurffläche Sturm 2024.',
    forstamt: 'Forstamt Miesbach',
    revier: 'Revier Bayerisches Oberland',
  },
  {
    name: 'Friedrich Meier',
    email: 'f.meier@waldbesitz.de',
    telefon: '0261-5567834',
    flaeche_ha: 5.5,
    baumarten: 'Douglasie, Lärche, Kiefer',
    standort: 'Westerwald, Rheinland-Pfalz',
    bundesland: 'Rheinland-Pfalz',
    lat: 50.5432,
    lng: 7.8901,
    beschreibung: 'Große Aufforstungsfläche Westerwald, trockenheitsresistente Arten.',
    forstamt: 'Forstamt Westerburg',
    revier: 'Revier Westerwald-Nord',
  }
]

async function holeWpAnfragen(): Promise<Record<string, unknown>[]> {
  console.log('\n📡 Rufe WP-Anfragen ab...')
  try {
    const res = await fetch(`${WP_BASE}/anfragen`, {
      headers: { Authorization: WP_AUTH }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as Record<string, unknown>[]
    console.log(`   → ${data.length} Anfragen gefunden`)
    return data
  } catch (e) {
    console.log(`   ⚠️  WP-API nicht erreichbar: ${e}`)
    return []
  }
}

async function erstelleWpAnfrage(anfrage: typeof ANFRAGEN_DEMO[0]): Promise<string | null> {
  try {
    const res = await fetch(`${WP_BASE}/anfragen`, {
      method: 'POST',
      headers: {
        Authorization: WP_AUTH,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ka_name: anfrage.name,
        ka_email: anfrage.email,
        ka_telefon: anfrage.telefon,
        ka_flaeche: anfrage.flaeche_ha,
        ka_baumarten: anfrage.baumarten,
        ka_standort: anfrage.standort,
        ka_bundesland: anfrage.bundesland,
        ka_beschreibung: anfrage.beschreibung,
        ka_lat: anfrage.lat,
        ka_lng: anfrage.lng,
      })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { id: string }
    console.log(`   ✅ WP-Anfrage erstellt: ${data.id}`)
    return String(data.id)
  } catch (e) {
    console.log(`   ⚠️  WP POST fehlgeschlagen: ${e}`)
    return null
  }
}

async function erstelleAuftragInDB(
  anfrage: typeof ANFRAGEN_DEMO[0],
  wpId: string | null,
  index: number
): Promise<string> {
  const ts = Date.now().toString().slice(-4)
  const nummer = `AU-2026-${String(1000 + index).padStart(4, '0')}-${ts}`
  
  // Preis-Kalkulation für Angebot
  const preisProPflanze = 1.85  // €
  const stueckzahl = Math.round(anfrage.flaeche_ha * 2500)  // ~2500 Pflanzen/ha
  const kulturschutz = anfrage.flaeche_ha * 850  // €/ha
  const fahrten = 3 * 45  // 3 Fahrten × 45€
  const gesamtpreis = stueckzahl * preisProPflanze + kulturschutz + fahrten

  const auftrag = await prisma.auftrag.create({
    data: {
      titel: `Aufforstung ${anfrage.name} – ${anfrage.standort}`,
      typ: 'aufforstung',
      status: 'anfrage',
      waldbesitzer: anfrage.name,
      waldbesitzerEmail: anfrage.email,
      waldbesitzerTelefon: anfrage.telefon,
      flaeche_ha: anfrage.flaeche_ha,
      baumarten: anfrage.baumarten,
      standort: anfrage.standort,
      bundesland: anfrage.bundesland,
      beschreibung: anfrage.beschreibung,
      lat: anfrage.lat,
      lng: anfrage.lng,
      nummer,
      wpProjektId: wpId,
      wizardDaten: {
        forstamt: anfrage.forstamt,
        revier: anfrage.revier,
        kalkulation: {
          stueckzahl,
          preisProPflanze,
          kulturschutz,
          fahrten,
          gesamtpreis: Math.round(gesamtpreis * 100) / 100
        }
      },
      neuFlag: true,
    }
  })

  console.log(`   ✅ Auftrag erstellt: ${auftrag.id} (${nummer}) — ${anfrage.name}`)
  console.log(`      Kalkulation: ${stueckzahl} Pflanzen × ${preisProPflanze}€ + ${kulturschutz}€ Schutz + ${fahrten}€ Fahrten = ${Math.round(gesamtpreis)}€`)

  return auftrag.id
}

async function findeGruppeId(): Promise<string | null> {
  // Zuerst eine echte Gruppe in der DB suchen
  try {
    const gruppe = await prisma.gruppe.findFirst({
      orderBy: { createdAt: 'asc' }
    })
    if (gruppe) {
      console.log(`   → Gruppe gefunden: ${gruppe.id} (${gruppe.name || 'ohne Name'})`)
      return gruppe.id
    }
  } catch (e) {
    console.log(`   ⚠️  Gruppe-Tabelle Fehler: ${e}`)
  }
  console.log('   → Keine Gruppe gefunden — Zuweisung ohne gruppeId')
  return null
}

async function bestaetigenUndZuweisen(auftragId: string, gruppeId: string | null): Promise<void> {
  await prisma.auftrag.update({
    where: { id: auftragId },
    data: {
      status: 'bestätigt',
      gruppeId,
      startDatum: new Date('2026-04-07'),
      endDatum: new Date('2026-04-18'),
      neuFlag: false
    }
  })
  console.log(`   ✅ Auftrag ${auftragId} bestätigt + Gruppe ${gruppeId || 'keine'} zugewiesen`)
}

async function erstelleTagesprotokolle(
  auftragId: string,
  auftrag: typeof ANFRAGEN_DEMO[0],
  gruppeId: string | null
): Promise<string[]> {
  const ids: string[] = []

  const tage = [
    {
      datum: new Date('2026-04-07T07:30:00'),
      zeitBeginn: new Date('2026-04-07T07:30:00'),
      zeitEnde: new Date('2026-04-07T16:00:00'),
      pausezeit: 30,
      // Revier
      forstamt: auftrag.forstamt,
      revier: auftrag.revier,
      revierleiter: 'Franz Weber',
      abteilung: 'Abt. 12b',
      waldbesitzerName: auftrag.name,
      // Handpflanzung
      std_einschlag: 2.5,
      std_handpflanzung: 5.0,
      stk_pflanzung: 420,
      // Bohrer
      std_zum_bohrer: 0.0,
      std_mit_bohrer: 0.0,
      stk_pflanzung_mit_bohrer: 0,
      // Maschinen
      std_freischneider: 3.0,
      std_motorsaege: 1.5,
      // Pflanzenschutz
      std_wuchshuellen: 4.0,
      stk_wuchshuellen: 420,
      std_netze_staebe_spiralen: 0.0,
      stk_netze_staebe_spiralen: 0,
      // Zaunbau
      std_zaunbau: 0.0,
      stk_drahtverbinder: 0,
      lfm_zaunbau: 0.0,
      // Nachbesserung
      std_nachbesserung: 0.0,
      stk_nachbesserung: 0,
      std_sonstige_arbeiten: 1.0,
      // Protokoll
      witterung: 'bewölkt, 8°C, leichter Wind',
      kommentar: 'Erster Planztag. Boden noch etwas feucht, ideal für Pflanzung. Team eingespielt. Oberboden gut durchwurzelbar.',
      bericht: 'Tag 1: Vorbereitung und Start der Aufforstung. Fläche abgesteckt, Material angeliefert. Erste 420 Eichen und Buchen gepflanzt, alle mit Wuchshüllen gesichert. Keine besonderen Vorkommnisse.',
      // GPS
      gpsStartLat: auftrag.lat,
      gpsStartLon: auftrag.lng,
      gpsEndLat: auftrag.lat + 0.002,
      gpsEndLon: auftrag.lng + 0.003,
      gpsTrack: {
        type: 'LineString',
        coordinates: [
          [auftrag.lng, auftrag.lat],
          [auftrag.lng + 0.001, auftrag.lat + 0.001],
          [auftrag.lng + 0.003, auftrag.lat + 0.002]
        ]
      },
      fotos: ['foto_2026-04-07_001.jpg', 'foto_2026-04-07_002.jpg'],
      status: 'eingereicht',
      eingereichtAm: new Date('2026-04-07T17:00:00'),
    },
    {
      datum: new Date('2026-04-08T07:15:00'),
      zeitBeginn: new Date('2026-04-08T07:15:00'),
      zeitEnde: new Date('2026-04-08T15:45:00'),
      pausezeit: 45,
      forstamt: auftrag.forstamt,
      revier: auftrag.revier,
      revierleiter: 'Franz Weber',
      abteilung: 'Abt. 12b',
      waldbesitzerName: auftrag.name,
      std_einschlag: 1.5,
      std_handpflanzung: 4.5,
      stk_pflanzung: 380,
      std_zum_bohrer: 1.0,
      std_mit_bohrer: 2.0,
      stk_pflanzung_mit_bohrer: 210,
      std_freischneider: 2.5,
      std_motorsaege: 0.5,
      std_wuchshuellen: 3.5,
      stk_wuchshuellen: 380,
      std_netze_staebe_spiralen: 1.5,
      stk_netze_staebe_spiralen: 45,
      std_zaunbau: 2.0,
      stk_drahtverbinder: 120,
      lfm_zaunbau: 85.0,
      std_nachbesserung: 0.5,
      stk_nachbesserung: 12,
      std_sonstige_arbeiten: 0.5,
      witterung: 'sonnig, 12°C, windstill',
      kommentar: 'Optimales Wetter. Bohrer sehr effektiv bei Steinboden im Nordbereich. 12 Ausfälle vom Vortag nachgebessert.',
      bericht: 'Tag 2: Pflanzung weiter fortgesetzt. Kombination Hand + Bohrer im Nordbereich (steiniger Boden). 85m Zaun gezogen. Insgesamt läuft die Fläche sehr gut. Waldbesitzer kurz vor Ort – zufrieden.',
      gpsStartLat: auftrag.lat + 0.002,
      gpsStartLon: auftrag.lng + 0.003,
      gpsEndLat: auftrag.lat + 0.005,
      gpsEndLon: auftrag.lng + 0.006,
      gpsTrack: {
        type: 'LineString',
        coordinates: [
          [auftrag.lng + 0.003, auftrag.lat + 0.002],
          [auftrag.lng + 0.005, auftrag.lat + 0.004],
          [auftrag.lng + 0.006, auftrag.lat + 0.005]
        ]
      },
      fotos: ['foto_2026-04-08_001.jpg', 'foto_2026-04-08_002.jpg', 'foto_2026-04-08_bohrer.jpg'],
      status: 'eingereicht',
      eingereichtAm: new Date('2026-04-08T16:30:00'),
    },
    {
      datum: new Date('2026-04-09T07:00:00'),
      zeitBeginn: new Date('2026-04-09T07:00:00'),
      zeitEnde: new Date('2026-04-09T14:00:00'),
      pausezeit: 30,
      forstamt: auftrag.forstamt,
      revier: auftrag.revier,
      revierleiter: 'Franz Weber',
      abteilung: 'Abt. 12c',
      waldbesitzerName: auftrag.name,
      std_einschlag: 1.0,
      std_handpflanzung: 3.0,
      stk_pflanzung: 290,
      std_zum_bohrer: 0.5,
      std_mit_bohrer: 1.5,
      stk_pflanzung_mit_bohrer: 180,
      std_freischneider: 1.5,
      std_motorsaege: 0.0,
      std_wuchshuellen: 2.5,
      stk_wuchshuellen: 290,
      std_netze_staebe_spiralen: 2.0,
      stk_netze_staebe_spiralen: 30,
      std_zaunbau: 1.5,
      stk_drahtverbinder: 80,
      lfm_zaunbau: 55.0,
      std_nachbesserung: 1.0,
      stk_nachbesserung: 28,
      std_sonstige_arbeiten: 1.5,
      witterung: 'leichter Regen, 6°C, böiger Wind',
      kommentar: 'Abschluss Teilbereich. Regen hat Pflanzung erschwert aber Anwuchs begünstigt. 28 Ausfälle vom Vortag identifiziert und nachgebessert. Abschnitt 12c fertig.',
      bericht: 'Tag 3: Abschluss Abt. 12c. Trotz Regen produktiv gearbeitet. Nachbesserungen erledigt. Gesamtbereich 12b/12c komplett bepflanzt und geschützt. Protokoll vollständig.',
      gpsStartLat: auftrag.lat + 0.005,
      gpsStartLon: auftrag.lng + 0.006,
      gpsEndLat: auftrag.lat + 0.008,
      gpsEndLon: auftrag.lng + 0.009,
      gpsTrack: {
        type: 'LineString',
        coordinates: [
          [auftrag.lng + 0.006, auftrag.lat + 0.005],
          [auftrag.lng + 0.008, auftrag.lat + 0.007],
          [auftrag.lng + 0.009, auftrag.lat + 0.008]
        ]
      },
      fotos: ['foto_2026-04-09_001.jpg', 'foto_2026-04-09_abschluss.jpg'],
      status: 'eingereicht',
      eingereichtAm: new Date('2026-04-09T15:00:00'),
    }
  ]

  for (let i = 0; i < tage.length; i++) {
    const tag = tage[i]
    const p = await prisma.tagesprotokoll.create({
      data: {
        auftragId,
        gruppeId,
        datum: tag.datum,
        ersteller: 'Hans Gruber (Gruppenführer)',
        erstellerId: null,
        // Revier
        forstamt: tag.forstamt,
        revier: tag.revier,
        revierleiter: tag.revierleiter,
        abteilung: tag.abteilung,
        waldbesitzerName: tag.waldbesitzerName,
        // Arbeitszeit
        zeitBeginn: tag.zeitBeginn,
        zeitEnde: tag.zeitEnde,
        pausezeit: tag.pausezeit,
        // Hand
        std_einschlag: tag.std_einschlag,
        std_handpflanzung: tag.std_handpflanzung,
        stk_pflanzung: tag.stk_pflanzung,
        // Bohrer
        std_zum_bohrer: tag.std_zum_bohrer,
        std_mit_bohrer: tag.std_mit_bohrer,
        stk_pflanzung_mit_bohrer: tag.stk_pflanzung_mit_bohrer,
        // Maschinen
        std_freischneider: tag.std_freischneider,
        std_motorsaege: tag.std_motorsaege,
        // Pflanzenschutz
        std_wuchshuellen: tag.std_wuchshuellen,
        stk_wuchshuellen: tag.stk_wuchshuellen,
        std_netze_staebe_spiralen: tag.std_netze_staebe_spiralen,
        stk_netze_staebe_spiralen: tag.stk_netze_staebe_spiralen,
        // Zaunbau
        std_zaunbau: tag.std_zaunbau,
        stk_drahtverbinder: tag.stk_drahtverbinder,
        lfm_zaunbau: tag.lfm_zaunbau,
        // Nachbesserung
        std_nachbesserung: tag.std_nachbesserung,
        stk_nachbesserung: tag.stk_nachbesserung,
        std_sonstige_arbeiten: tag.std_sonstige_arbeiten,
        // Protokoll
        witterung: tag.witterung,
        kommentar: tag.kommentar,
        bericht: tag.bericht,
        // GPS
        gpsStartLat: tag.gpsStartLat,
        gpsStartLon: tag.gpsStartLon,
        gpsEndLat: tag.gpsEndLat,
        gpsEndLon: tag.gpsEndLon,
        gpsTrack: tag.gpsTrack,
        // Doku
        fotos: tag.fotos,
        // Status
        status: tag.status,
        eingereichtAm: tag.eingereichtAm,
      }
    })
    console.log(`   ✅ Tagesprotokoll ${i + 1}: ${p.id} (${tag.datum.toISOString().split('T')[0]})`)
    ids.push(p.id)
  }

  return ids
}

async function main() {
  console.log('\n🌲 FORSTMANAGER WORKFLOW-SIMULATION')
  console.log('=====================================')

  // 1. WP-Anfragen prüfen
  const wpAnfragen = await holeWpAnfragen()
  const habenWpDaten = wpAnfragen.length >= 3

  // 2. Aufträge erstellen
  const auftragIds: string[] = []

  for (let i = 0; i < 3; i++) {
    console.log(`\n📋 Verarbeite Anfrage ${i + 1}: ${ANFRAGEN_DEMO[i].name}`)

    let wpId: string | null = null
    if (habenWpDaten) {
      wpId = String((wpAnfragen[i] as { id: string }).id)
    } else {
      // WP-Anfrage erstellen
      wpId = await erstelleWpAnfrage(ANFRAGEN_DEMO[i])
    }

    const auftragId = await erstelleAuftragInDB(ANFRAGEN_DEMO[i], wpId, i)
    auftragIds.push(auftragId)
  }

  // 3. Gruppe finden
  console.log('\n👷 Suche Gruppe in DB...')
  let gfId: string | null = null
  try {
    gfId = await findeGruppeId()
  } catch (e) {
    console.log(`   ⚠️  Gruppe-Suche fehlgeschlagen: ${e}`)
  }

  // 4. Aufträge 1+2 bestätigen
  console.log('\n✅ Bestätige Aufträge 1+2...')
  for (let i = 0; i < 2; i++) {
    await bestaetigenUndZuweisen(auftragIds[i], gfId)
  }

  // 5. Tagesprotokolle für Auftrag 1
  console.log(`\n📝 Erstelle 3 Tagesprotokolle für Auftrag 1 (${auftragIds[0]})...`)
  const protokollIds = await erstelleTagesprotokolle(auftragIds[0], ANFRAGEN_DEMO[0], gfId)

  // Zusammenfassung
  console.log('\n\n📊 SIMULATION ABGESCHLOSSEN')
  console.log('============================')
  console.log('Erstellte Aufträge:')
  auftragIds.forEach((id, i) => {
    const status = i < 2 ? 'bestätigt' : 'anfrage'
    console.log(`  [AU-${i+1}] ${id} → ${status}`)
  })
  console.log('\nErstellte Tagesprotokolle (Auftrag 1):')
  protokollIds.forEach((id, i) => {
    const datum = ['2026-04-07', '2026-04-08', '2026-04-09'][i]
    console.log(`  [TP-${i+1}] ${id} → ${datum} (eingereicht)`)
  })

  console.log('\nIDs für Dokumentation:')
  console.log(JSON.stringify({ auftragIds, protokollIds }, null, 2))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
