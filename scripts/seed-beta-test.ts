/**
 * Seed-Script: Beta-Test Vorbereitung
 * Sprint AM — Koch Aufforstung GmbH ForstManager
 *
 * Erstellt:
 * - 5 Test-Benutzerkonten (mitarbeiter, gruppenführer, förster, admin)
 * - 3 Test-Projekte (Aufträge)
 * - 10 Test-Einsätze (Tagesprotokolle)
 *
 * Verwendung: npx tsx scripts/seed-beta-test.ts
 * ACHTUNG: Nur für Testumgebung! Nicht in Produktion ausführen.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

// Lade .env.local für lokale Ausführung
dotenv.config({ path: ".env.local" })
dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── Konstanten ──────────────────────────────────────────────────────────────

const PASSWORT = "Test1234!"
const SALT_ROUNDS = 10

// Test-Benutzerkonten
const TEST_BENUTZER = [
  {
    name: "Max Mustermann",
    email: "max.mustermann@test.de",
    rolle: "ka_mitarbeiter",
    mitarbeiterRolle: "mitarbeiter",
    vorname: "Max",
    nachname: "Mustermann",
  },
  {
    name: "Anna Schmidt",
    email: "anna.schmidt@test.de",
    rolle: "ka_mitarbeiter",
    mitarbeiterRolle: "mitarbeiter",
    vorname: "Anna",
    nachname: "Schmidt",
  },
  {
    name: "GF Weber",
    email: "gf.weber@test.de",
    rolle: "ka_gruppenführer",
    mitarbeiterRolle: "gruppenführer",
    vorname: "Thomas",
    nachname: "Weber",
  },
  {
    name: "Förster Braun",
    email: "foerster.braun@test.de",
    rolle: "ka_mitarbeiter",
    mitarbeiterRolle: "förster",
    vorname: "Klaus",
    nachname: "Braun",
  },
  {
    name: "Beta Admin",
    email: "admin.beta@test.de",
    rolle: "ka_admin",
    mitarbeiterRolle: "admin",
    vorname: "Beta",
    nachname: "Admin",
  },
]

// Test-Projekte (Aufträge)
const TEST_PROJEKTE = [
  {
    titel: "Aufforstung Taunus 2026",
    typ: "pflanzung",
    beschreibung: "Beta-Test Projekt: Wiederaufforstung nach Trockenheit im Taunus",
    standort: "Taunus, Hessen",
    bundesland: "Hessen",
    flaeche_ha: 12.5,
    waldbesitzer: "Stadtwald Bad Homburg",
    status: "aktiv",
  },
  {
    titel: "Pflanzung Spessart 2026",
    typ: "pflanzung",
    beschreibung: "Beta-Test Projekt: Neuanlage Mischwaldpflanzung im Spessart",
    standort: "Spessart, Bayern",
    bundesland: "Bayern",
    flaeche_ha: 8.0,
    waldbesitzer: "Forstbetrieb Spessart GmbH",
    status: "aktiv",
  },
  {
    titel: "Kulturpflege Odenwald 2026",
    typ: "kulturpflege",
    beschreibung: "Beta-Test Projekt: Kulturpflege junger Bestände im Odenwald",
    standort: "Odenwald, Baden-Württemberg",
    bundesland: "Baden-Württemberg",
    flaeche_ha: 5.3,
    waldbesitzer: "Privat Hans Müller",
    status: "geplant",
  },
]

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────

function zufaelligesDatum(offsetTage: number): Date {
  const datum = new Date()
  datum.setDate(datum.getDate() + offsetTage)
  return datum
}

// ── Haupt-Seed-Funktion ──────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Beta-Test Seed startet...")
  console.log("⚠️  ACHTUNG: Nur für Testumgebung verwenden!\n")

  // Passwort hashen
  const passwortHash = await bcrypt.hash(PASSWORT, SALT_ROUNDS)
  console.log("🔐 Passwort-Hash erstellt")

  // ── 1. Test-Benutzer anlegen ─────────────────────────────────────────────
  console.log("\n👥 Erstelle Test-Benutzer...")
  const angelegteUser: Record<string, string> = {}

  for (const benutzer of TEST_BENUTZER) {
    // Prüfe ob Benutzer bereits existiert
    const vorhandener = await prisma.user.findUnique({
      where: { email: benutzer.email },
    })

    if (vorhandener) {
      console.log(`  ⏭️  Überspringe ${benutzer.email} (bereits vorhanden)`)
      angelegteUser[benutzer.email] = vorhandener.id
      continue
    }

    const user = await prisma.user.create({
      data: {
        name: benutzer.name,
        email: benutzer.email,
        password: passwortHash,
        role: benutzer.rolle,
        active: true,
      },
    })

    // Mitarbeiter-Eintrag erstellen
    await prisma.mitarbeiter.create({
      data: {
        userId: user.id,
        vorname: benutzer.vorname,
        nachname: benutzer.nachname,
        email: benutzer.email,
        rolle: benutzer.mitarbeiterRolle,
        eintrittsdatum: new Date("2026-04-01"),
      },
    })

    angelegteUser[benutzer.email] = user.id
    console.log(`  ✅ ${benutzer.email} (${benutzer.rolle}) angelegt`)
  }

  // ── 2. Test-Projekte anlegen ─────────────────────────────────────────────
  console.log("\n📂 Erstelle Test-Projekte...")
  const angelegteProjekte: string[] = []

  for (const projekt of TEST_PROJEKTE) {
    // Prüfe ob Projekt bereits existiert
    const vorhandenes = await prisma.auftrag.findFirst({
      where: { titel: projekt.titel },
    })

    if (vorhandenes) {
      console.log(`  ⏭️  Überspringe "${projekt.titel}" (bereits vorhanden)`)
      angelegteProjekte.push(vorhandenes.id)
      continue
    }

    const auftrag = await prisma.auftrag.create({
      data: {
        titel: projekt.titel,
        typ: projekt.typ,
        beschreibung: projekt.beschreibung,
        standort: projekt.standort,
        bundesland: projekt.bundesland,
        flaeche_ha: projekt.flaeche_ha,
        waldbesitzer: projekt.waldbesitzer,
        status: projekt.status,
        startDatum: new Date("2026-04-01"),
        endDatum: new Date("2026-09-30"),
        notizen: "Beta-Test Projekt — nicht für Produktion",
      },
    })

    angelegteProjekte.push(auftrag.id)
    console.log(`  ✅ "${projekt.titel}" angelegt`)
  }

  // ── 3. Test-Einsätze anlegen (10 Tagesprotokolle) ─────────────────────────
  console.log("\n📅 Erstelle Test-Einsätze (10 Tagesprotokolle)...")

  const einsaetze = [
    // Projekt 1: Aufforstung Taunus — 4 Einsätze
    { auftragIdx: 0, offsetTage: 0, bericht: "Aufforstung Taunus: Beginn Pflanzarbeiten Abschnitt Nord", gepflanzt: 450, witterung: "sonnig" },
    { auftragIdx: 0, offsetTage: 1, bericht: "Aufforstung Taunus: Fortsetzung Pflanzarbeiten, leichter Regen", gepflanzt: 380, witterung: "bewölkt" },
    { auftragIdx: 0, offsetTage: 3, bericht: "Aufforstung Taunus: Pflanzarbeiten Abschnitt Süd", gepflanzt: 520, witterung: "sonnig" },
    { auftragIdx: 0, offsetTage: 5, bericht: "Aufforstung Taunus: Abschluss Pflanzung + Qualitätskontrolle", gepflanzt: 290, witterung: "bedeckt" },
    // Projekt 2: Pflanzung Spessart — 4 Einsätze
    { auftragIdx: 1, offsetTage: 0, bericht: "Spessart: Geländevorbereitung und Absteckung", gepflanzt: 0, witterung: "sonnig" },
    { auftragIdx: 1, offsetTage: 2, bericht: "Spessart: Buchen und Eichen gepflanzt, Abschnitt A", gepflanzt: 620, witterung: "sonnig" },
    { auftragIdx: 1, offsetTage: 4, bericht: "Spessart: Pflanzung Abschnitt B abgeschlossen", gepflanzt: 550, witterung: "leichter Wind" },
    { auftragIdx: 1, offsetTage: 7, bericht: "Spessart: Nachpflanzung und Wühlmausschutz", gepflanzt: 180, witterung: "bewölkt" },
    // Projekt 3: Kulturpflege Odenwald — 2 Einsätze
    { auftragIdx: 2, offsetTage: 0, bericht: "Odenwald: Mäharbeiten Streifen Nord begonnen", gepflanzt: 0, witterung: "sonnig" },
    { auftragIdx: 2, offsetTage: 2, bericht: "Odenwald: Kulturpflege Abschnitt Mitte — Brombeere zurückgeschnitten", gepflanzt: 0, witterung: "bewölkt" },
  ]

  for (let i = 0; i < einsaetze.length; i++) {
    const einsatz = einsaetze[i]
    const auftragId = angelegteProjekte[einsatz.auftragIdx]

    if (!auftragId) {
      console.log(`  ⚠️  Kein Auftrag für Einsatz ${i + 1} gefunden`)
      continue
    }

    await prisma.tagesprotokoll.create({
      data: {
        auftragId,
        datum: zufaelligesDatum(einsatz.offsetTage),
        bericht: einsatz.bericht,
        gepflanzt: einsatz.gepflanzt || null,
        witterung: einsatz.witterung,
        ersteller: "Beta-Test",
      },
    })

    console.log(`  ✅ Einsatz ${i + 1}: "${einsatz.bericht.substring(0, 50)}..."`)
  }

  // ── Zusammenfassung ──────────────────────────────────────────────────────
  console.log("\n🎉 Beta-Test Seed erfolgreich abgeschlossen!")
  console.log("─────────────────────────────────────────")
  console.log(`✅ ${TEST_BENUTZER.length} Test-Benutzerkonten`)
  console.log(`✅ ${TEST_PROJEKTE.length} Test-Projekte`)
  console.log(`✅ ${einsaetze.length} Test-Einsätze`)
  console.log("\n📧 Test-Konten:")
  for (const b of TEST_BENUTZER) {
    console.log(`   ${b.email}  /  ${PASSWORT}  (${b.rolle})`)
  }
  console.log("─────────────────────────────────────────")
}

main()
  .catch((e) => {
    console.error("❌ Fehler beim Seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
