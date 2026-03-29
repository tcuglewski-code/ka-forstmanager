/**
 * Demo-Seed-Script für AppFabrik Demo-Umgebung
 * Erstellt realistische Beispieldaten für Sales-Demos
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Starte Demo-Seed...")

  // Passwort für alle Demo-User
  const demoPassword = await bcrypt.hash("Demo2026!", 10)

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-betrieb" },
    update: {},
    create: {
      name: "Mustermann Forstbetrieb GmbH",
      slug: "demo-betrieb",
      primaryColor: "#2D5016",
    },
  })
  console.log("✅ Tenant erstellt:", tenant.name)

  // 2. Demo-User (verschiedene Rollen)
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.appfabrik.de" },
    update: {},
    create: {
      name: "Max Mustermann",
      email: "admin@demo.appfabrik.de",
      password: demoPassword,
      role: "admin",
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: "maria@demo.appfabrik.de" },
    update: {},
    create: {
      name: "Maria Schmidt",
      email: "maria@demo.appfabrik.de",
      password: demoPassword,
      role: "manager",
    },
  })

  const worker = await prisma.user.upsert({
    where: { email: "tom@demo.appfabrik.de" },
    update: {},
    create: {
      name: "Tom Weber",
      email: "tom@demo.appfabrik.de",
      password: demoPassword,
      role: "worker",
    },
  })
  console.log("✅ 3 Demo-User erstellt (admin, manager, worker)")

  // 3. Demo-Mitarbeiter
  const mitarbeiter = [
    { name: "Max Mustermann", rolle: "Geschäftsführer", telefon: "+49 176 12345678", email: "max@demo.de" },
    { name: "Maria Schmidt", rolle: "Gruppenleiterin", telefon: "+49 176 23456789", email: "maria@demo.de" },
    { name: "Tom Weber", rolle: "Forstwirt", telefon: "+49 176 34567890", email: "tom@demo.de" },
    { name: "Lisa Müller", rolle: "Forstwirtin", telefon: "+49 176 45678901", email: "lisa@demo.de" },
    { name: "Jan Becker", rolle: "Auszubildender", telefon: "+49 176 56789012", email: "jan@demo.de" },
  ]

  for (const ma of mitarbeiter) {
    await prisma.mitarbeiter.upsert({
      where: { email: ma.email },
      update: {},
      create: ma,
    })
  }
  console.log("✅ 5 Demo-Mitarbeiter erstellt")

  // 4. Demo-Kunden
  const kunden = [
    {
      name: "Dr. Heinrich Waldmann",
      email: "waldmann@example.de",
      telefon: "+49 89 1234567",
      adresse: "Waldstraße 42, 80331 München",
      notizen: "Waldbesitzer mit 45 ha Mischwald. Interessiert an Klimawald-Umbau.",
    },
    {
      name: "Forstverwaltung Schwarzwald GmbH",
      email: "info@forst-schwarzwald.de",
      telefon: "+49 761 9876543",
      adresse: "Forstweg 1, 79098 Freiburg",
      notizen: "Kommunaler Forstbetrieb, 1.200 ha. Großauftrag möglich.",
    },
    {
      name: "Familie Meyer",
      email: "meyer.wald@example.de",
      telefon: "+49 911 5551234",
      adresse: "Lindenallee 7, 90403 Nürnberg",
      notizen: "Privatwald 12 ha, nach Sturmschaden Wiederaufforstung nötig.",
    },
  ]

  for (const k of kunden) {
    await prisma.kunde.upsert({
      where: { email: k.email },
      update: {},
      create: k,
    })
  }
  console.log("✅ 3 Demo-Kunden erstellt")

  // 5. Demo-Aufträge mit verschiedenen Status
  const kundeWaldmann = await prisma.kunde.findFirst({ where: { email: "waldmann@example.de" } })
  const kundeForst = await prisma.kunde.findFirst({ where: { email: "info@forst-schwarzwald.de" } })
  const kundeMeyer = await prisma.kunde.findFirst({ where: { email: "meyer.wald@example.de" } })

  const auftraege = [
    {
      titel: "Aufforstung Nordwald - Klimawald",
      beschreibung: "Aufforstung von 5 ha mit klimaresistenten Baumarten (Eiche, Douglasie, Weißtanne). Inklusive Flächenvorbereitung und 5-jähriger Kulturpflege.",
      status: "in_arbeit",
      kundeId: kundeWaldmann?.id,
      flaeche: 5.0,
      standort: "Nordwald, Flurstück 127/3",
      geplantStart: new Date("2026-04-15"),
      geplantEnde: new Date("2026-05-30"),
    },
    {
      titel: "Kalamitätsfläche Sturmholz",
      beschreibung: "Räumung und Wiederaufforstung nach Sturmschaden. 2,5 ha Fichte-Totalausfall. Ersatz durch Mischwald.",
      status: "geplant",
      kundeId: kundeMeyer?.id,
      flaeche: 2.5,
      standort: "Gemeindewald Süd, Abt. 14",
      geplantStart: new Date("2026-05-01"),
      geplantEnde: new Date("2026-06-15"),
    },
    {
      titel: "Jungbestandspflege 2026",
      beschreibung: "Pflege von 12 ha Jungbestand (Pflanzjahr 2023). Freischneiden, Stammzahlreduktion, Qualitätsauswahl.",
      status: "abgeschlossen",
      kundeId: kundeForst?.id,
      flaeche: 12.0,
      standort: "Distrikt Hochwald, Abt. 7-9",
      geplantStart: new Date("2026-02-01"),
      geplantEnde: new Date("2026-03-15"),
    },
    {
      titel: "Saatguternte Weißtanne",
      beschreibung: "Beerntung von 5 Weißtannen-Plusbäumen. Zertifiziertes Saatgut für Forstbaumschule.",
      status: "angefragt",
      kundeId: kundeForst?.id,
      flaeche: 0.5,
      standort: "Saatgutbestand T-BW-123",
      geplantStart: new Date("2026-10-01"),
      geplantEnde: new Date("2026-10-15"),
    },
  ]

  for (const a of auftraege) {
    if (a.kundeId) {
      await prisma.auftrag.create({
        data: a as any,
      })
    }
  }
  console.log("✅ 4 Demo-Aufträge erstellt")

  // 6. Demo-Lagerbestände
  const lagerItems = [
    { name: "Eichensetzlinge 2j", kategorie: "Pflanzgut", menge: 5000, einheit: "Stück", mindestbestand: 1000 },
    { name: "Douglasie 1+1", kategorie: "Pflanzgut", menge: 3500, einheit: "Stück", mindestbestand: 500 },
    { name: "Weißtanne 2+2", kategorie: "Pflanzgut", menge: 2000, einheit: "Stück", mindestbestand: 500 },
    { name: "Verbissschutz-Spiralen", kategorie: "Material", menge: 8000, einheit: "Stück", mindestbestand: 2000 },
    { name: "Pflanzspaten", kategorie: "Werkzeug", menge: 15, einheit: "Stück", mindestbestand: 10 },
    { name: "Freischneider Stihl FS 560", kategorie: "Gerät", menge: 4, einheit: "Stück", mindestbestand: 2 },
  ]

  for (const item of lagerItems) {
    await prisma.lager.create({
      data: item,
    })
  }
  console.log("✅ 6 Demo-Lagerbestände erstellt")

  // 7. Demo-Rechnungen
  const rechnungen = [
    {
      nummer: "RE-2026-001",
      kundeId: kundeForst?.id,
      betrag: 18500.00,
      status: "bezahlt",
      faelligAm: new Date("2026-02-28"),
      bezahltAm: new Date("2026-02-25"),
      beschreibung: "Jungbestandspflege 2026 - Abschlussrechnung",
    },
    {
      nummer: "RE-2026-002",
      kundeId: kundeWaldmann?.id,
      betrag: 12750.00,
      status: "offen",
      faelligAm: new Date("2026-04-30"),
      beschreibung: "Aufforstung Nordwald - Anzahlung 50%",
    },
  ]

  for (const r of rechnungen) {
    if (r.kundeId) {
      await prisma.rechnung.create({
        data: r as any,
      })
    }
  }
  console.log("✅ 2 Demo-Rechnungen erstellt")

  console.log("\n🎉 Demo-Seed abgeschlossen!")
  console.log("\n📋 Demo-Login-Daten:")
  console.log("   Admin:   admin@demo.appfabrik.de / Demo2026!")
  console.log("   Manager: maria@demo.appfabrik.de / Demo2026!")
  console.log("   Worker:  tom@demo.appfabrik.de / Demo2026!")
}

main()
  .catch((e) => {
    console.error("❌ Fehler beim Demo-Seed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
