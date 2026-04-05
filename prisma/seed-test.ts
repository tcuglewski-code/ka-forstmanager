import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding test data...")

  const hashedPw = await bcrypt.hash("Test1234!", 10)

  // --- 5 Users with different roles ---
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "TEST_Admin Koch",
        email: "test_admin@koch-aufforstung.de",
        password: hashedPw,
        role: "ka_admin",
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "TEST_Gruppenführer Meier",
        email: "test_gruppenfuehrer@koch-aufforstung.de",
        password: hashedPw,
        role: "ka_gruppenführer",
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "TEST_Mitarbeiter Schulz",
        email: "test_mitarbeiter@koch-aufforstung.de",
        password: hashedPw,
        role: "ka_mitarbeiter",
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "TEST_Baumschule Weber",
        email: "test_baumschule@koch-aufforstung.de",
        password: hashedPw,
        role: "baumschule",
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "TEST_Kunde Fischer",
        email: "test_kunde@example.de",
        password: hashedPw,
        role: "kunde",
        active: true,
      },
    }),
  ])
  console.log(`  ✅ ${users.length} Users created`)

  // --- 10 Kunden (Kontakt entries with typ "waldbesitzer") ---
  const kundenNames = [
    "TEST_Waldbesitzer Müller",
    "TEST_Waldbesitzer Schmidt",
    "TEST_Waldbesitzer Schneider",
    "TEST_Waldbesitzer Fischer",
    "TEST_Waldbesitzer Weber",
    "TEST_Waldbesitzer Wagner",
    "TEST_Waldbesitzer Becker",
    "TEST_Waldbesitzer Hoffmann",
    "TEST_Waldbesitzer Richter",
    "TEST_Waldbesitzer Klein",
  ]

  const kunden = await Promise.all(
    kundenNames.map((name, i) =>
      prisma.kontakt.create({
        data: {
          name,
          typ: "waldbesitzer",
          email: `test_kunde${i + 1}@example.de`,
          telefon: `+49 170 ${String(1000000 + i).slice(0, 7)}`,
          forstamt: `TEST_Forstamt ${["Nord", "Süd", "Ost", "West", "Mitte"][i % 5]}`,
          adresse: `Waldweg ${i + 1}, ${10000 + i * 111} Teststadt`,
        },
      })
    )
  )
  console.log(`  ✅ ${kunden.length} Kunden (Kontakte) created`)

  // --- 10 Mitarbeiter ---
  const mitarbeiterData = [
    { vorname: "TEST_Hans", nachname: "Förster", rolle: "vorarbeiter" },
    { vorname: "TEST_Klaus", nachname: "Holz", rolle: "mitarbeiter" },
    { vorname: "TEST_Peter", nachname: "Wald", rolle: "mitarbeiter" },
    { vorname: "TEST_Maria", nachname: "Grün", rolle: "gruppenführer" },
    { vorname: "TEST_Anna", nachname: "Baum", rolle: "mitarbeiter" },
    { vorname: "TEST_Fritz", nachname: "Tanne", rolle: "mitarbeiter" },
    { vorname: "TEST_Eva", nachname: "Eiche", rolle: "vorarbeiter" },
    { vorname: "TEST_Karl", nachname: "Buche", rolle: "mitarbeiter" },
    { vorname: "TEST_Luise", nachname: "Birke", rolle: "mitarbeiter" },
    { vorname: "TEST_Max", nachname: "Kiefer", rolle: "praktikant" },
  ]

  const mitarbeiter = await Promise.all(
    mitarbeiterData.map((m, i) =>
      prisma.mitarbeiter.create({
        data: {
          vorname: m.vorname,
          nachname: m.nachname,
          email: `test_ma${i + 1}@koch-aufforstung.de`,
          rolle: m.rolle,
          status: i < 9 ? "aktiv" : "inaktiv",
          stundenlohn: 15 + i * 1.5,
          eintrittsdatum: new Date(2024, 0, 1 + i * 30),
        },
      })
    )
  )
  console.log(`  ✅ ${mitarbeiter.length} Mitarbeiter created`)

  // --- 20 Projekte (Auftrag entries) ---
  const typen = ["pflanzung", "kulturschutz", "saatguternte", "jungbestandspflege", "zaunbau"]
  const statusValues = ["anfrage", "geplant", "aktiv", "abgeschlossen", "storniert"]
  const bundeslaender = ["Bayern", "Hessen", "Thüringen", "Sachsen", "Brandenburg"]

  const auftraege = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      prisma.auftrag.create({
        data: {
          titel: `TEST_Projekt ${String(i + 1).padStart(2, "0")} - ${typen[i % typen.length]}`,
          typ: typen[i % typen.length],
          status: statusValues[i % statusValues.length],
          beschreibung: `Testprojekt Nr. ${i + 1} für automatisierte Tests`,
          flaeche_ha: 5 + i * 2.5,
          standort: `TEST_Standort ${i + 1}`,
          bundesland: bundeslaender[i % bundeslaender.length],
          waldbesitzer: kundenNames[i % kundenNames.length],
          waldbesitzerEmail: `test_kunde${(i % 10) + 1}@example.de`,
          startDatum: new Date(2026, i % 12, 1),
          endDatum: new Date(2026, (i % 12) + 1, 15),
          lat: 50.0 + i * 0.1,
          lng: 10.0 + i * 0.15,
        },
      })
    )
  )
  console.log(`  ✅ ${auftraege.length} Aufträge created`)

  // --- 50 Stundeneinträge across Mitarbeiter ---
  const stundenTypen = ["arbeit", "fahrt", "maschine", "rüstzeit", "schulung"]
  const stundeneintraege = await Promise.all(
    Array.from({ length: 50 }, (_, i) => {
      const maIdx = i % mitarbeiter.length
      const auftragIdx = i % auftraege.length
      return prisma.stundeneintrag.create({
        data: {
          mitarbeiterId: mitarbeiter[maIdx].id,
          auftragId: auftraege[auftragIdx].id,
          datum: new Date(2026, Math.floor(i / 20), (i % 28) + 1),
          stunden: 4 + (i % 5),
          typ: stundenTypen[i % stundenTypen.length],
          notiz: `TEST_Stundeneintrag ${i + 1}`,
          genehmigt: i % 3 === 0,
          stundenlohn: 15 + maIdx * 1.5,
        },
      })
    })
  )
  console.log(`  ✅ ${stundeneintraege.length} Stundeneinträge created`)

  console.log("\n🎉 Test seed complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
