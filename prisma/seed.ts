import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPw = await bcrypt.hash("Admin2026!", 10)

  await prisma.user.upsert({
    where: { email: "admin@koch-aufforstung.de" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@koch-aufforstung.de",
      password: hashedPw,
      role: "admin",
    },
  })

  await prisma.tenant.upsert({
    where: { slug: "koch-aufforstung" },
    update: {},
    create: {
      name: "Koch Aufforstung GmbH",
      slug: "koch-aufforstung",
      primaryColor: "#2C3A1C",
    },
  })

  // Sprint Q031: Auftrags-Templates (5 Standardvorlagen)
  const templates = [
    {
      name: "Standardpflanzung",
      beschreibung: "Typische Neupflanzung mit klimaangepassten Mischbeständen",
      typ: "pflanzung",
      defaultTitel: "Pflanzung - ",
      defaultBeschreibung: "Neupflanzung von klimaangepassten Mischbeständen. Pflanzverband und Baumarten nach Standortanalyse.",
      defaultFlaeche: 1.0,
      defaultBaumarten: "Eiche, Buche, Douglasie",
      defaultZeitraum: "März-Mai",
      defaultWizardDaten: {
        pflanzverband: "reihe",
        bezugsquelle: "baumschule"
      },
      icon: "TreeDeciduous",
      sortOrder: 1,
    },
    {
      name: "Kalamitätsfläche",
      beschreibung: "Wiederaufforstung nach Sturm, Borkenkäfer oder Feuer",
      typ: "pflanzung",
      defaultTitel: "Kalamitätsfläche - ",
      defaultBeschreibung: "Wiederaufforstung einer Schadfläche. Flächenvorbereitung erforderlich, ggf. Fördermittel prüfen.",
      defaultFlaeche: 2.5,
      defaultBaumarten: "Klimatolerante Mischung: Eiche, Douglasie, Küstentanne",
      defaultZeitraum: "Oktober-April",
      defaultWizardDaten: {
        pflanzverband: "unregelmaessig",
        bezugsquelle: "baumschule"
      },
      icon: "AlertTriangle",
      sortOrder: 2,
    },
    {
      name: "Kulturschutz",
      beschreibung: "Verbissschutz und Wuchshüllen für Jungpflanzen",
      typ: "kulturschutz",
      defaultTitel: "Kulturschutz - ",
      defaultBeschreibung: "Installation von Verbissschutz (Wuchshüllen, Einzelschutz). Wild- und Weideverbiss verhindern.",
      defaultFlaeche: 1.0,
      defaultZeitraum: "Ganzjährig",
      defaultWizardDaten: {
        schutztyp: ["wuchshuellen"],
        schutzart: "einzelschutz",
        robinienstab: "ja"
      },
      icon: "Shield",
      sortOrder: 3,
    },
    {
      name: "Saatguternte",
      beschreibung: "Ernte von zertifiziertem Forstsaatgut",
      typ: "saatguternte",
      defaultTitel: "Saatguternte - ",
      defaultBeschreibung: "Ernte von Forstsaatgut aus zugelassenen Erntebeständen. ZÜF-Bescheinigung erforderlich.",
      defaultZeitraum: "September-November",
      defaultWizardDaten: {
        bestandstyp: "zugelassen"
      },
      icon: "Leaf",
      sortOrder: 4,
    },
    {
      name: "Jungbestandspflege",
      beschreibung: "Freischneiden, Läuterung und Pflegeeingriffe",
      typ: "kulturpflege",
      defaultTitel: "Jungbestandspflege - ",
      defaultBeschreibung: "Pflege von Jungbeständen: Freischneiden, Läuterung, Mischungsregulierung. Förderfähig prüfen.",
      defaultFlaeche: 2.0,
      defaultZeitraum: "Juni-August",
      defaultWizardDaten: {
        aufwuchsart: ["naturverjuengung"],
        arbeitsmethode: "motorsense",
        turnus: "einmalig"
      },
      icon: "Scissors",
      sortOrder: 5,
    },
  ]

  for (const t of templates) {
    await prisma.auftragTemplate.upsert({
      where: { name: t.name },
      update: {
        beschreibung: t.beschreibung,
        typ: t.typ,
        defaultTitel: t.defaultTitel,
        defaultBeschreibung: t.defaultBeschreibung,
        defaultFlaeche: t.defaultFlaeche,
        defaultBaumarten: t.defaultBaumarten,
        defaultZeitraum: t.defaultZeitraum,
        defaultWizardDaten: t.defaultWizardDaten,
        icon: t.icon,
        sortOrder: t.sortOrder,
      },
      create: t,
    })
  }
  console.log("✅ 5 Auftrags-Templates erstellt/aktualisiert")

  console.log("✅ Seed erfolgreich")
}

main().catch(console.error).finally(() => prisma.$disconnect())
