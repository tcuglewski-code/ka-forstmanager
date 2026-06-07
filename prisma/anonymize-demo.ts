/**
 * Anonymisierungs-Script für Demo-System
 * Ersetzt alle Mitarbeiter-Namen mit fiktiven Namen (Mix DE/PL)
 * sowie zugehörige User-Accounts und Email-Adressen.
 *
 * Usage: DATABASE_URL=... npx tsx prisma/anonymize-demo.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Pool fiktiver Namen (Mix DE/PL)
const FAKE_NAMES: Array<{ vorname: string; nachname: string }> = [
  { vorname: "Marek", nachname: "Kowalski" },
  { vorname: "Piotr", nachname: "Nowak" },
  { vorname: "Anna", nachname: "Wiśniewska" },
  { vorname: "Jan", nachname: "Müller" },
  { vorname: "Klaus", nachname: "Fischer" },
  { vorname: "Thomas", nachname: "Bauer" },
  { vorname: "Stefan", nachname: "Wójcik" },
  { vorname: "Krzysztof", nachname: "Zielinski" },
  { vorname: "Maria", nachname: "Schmitt" },
  { vorname: "Hans", nachname: "Weber" },
  { vorname: "Lena", nachname: "Brandt" },
  { vorname: "Robert", nachname: "Kaczmarek" },
  { vorname: "Tomasz", nachname: "Wiśniewski" },
  { vorname: "Erik", nachname: "Hoffmann" },
  { vorname: "Monika", nachname: "Schulz" },
  { vorname: "Andrzej", nachname: "Lewandowski" },
  { vorname: "Sabine", nachname: "Becker" },
  { vorname: "Michał", nachname: "Dąbrowski" },
  { vorname: "Karl", nachname: "Wagner" },
  { vorname: "Agnieszka", nachname: "Kamińska" },
  { vorname: "Werner", nachname: "Koch" },
  { vorname: "Paweł", nachname: "Zieliński" },
  { vorname: "Helga", nachname: "Lehmann" },
  { vorname: "Magdalena", nachname: "Szymańska" },
  { vorname: "Dieter", nachname: "Krüger" },
  { vorname: "Bartosz", nachname: "Woźniak" },
  { vorname: "Petra", nachname: "Neumann" },
  { vorname: "Katarzyna", nachname: "Jankowska" },
  { vorname: "Heinrich", nachname: "Schwarz" },
  { vorname: "Łukasz", nachname: "Mazur" },
  { vorname: "Brigitte", nachname: "Zimmermann" },
  { vorname: "Ewa", nachname: "Kowalczyk" },
  { vorname: "Manfred", nachname: "Hartmann" },
  { vorname: "Grzegorz", nachname: "Pawlak" },
  { vorname: "Ursula", nachname: "Schmidt" },
  { vorname: "Joanna", nachname: "Krawczyk" },
  { vorname: "Friedrich", nachname: "Vogel" },
  { vorname: "Marcin", nachname: "Adamski" },
  { vorname: "Renate", nachname: "Richter" },
  { vorname: "Wojciech", nachname: "Witkowski" },
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź|ż/g, "z")
    .replace(/[^a-z0-9]/g, "")
}

async function main() {
  console.log("🔒 Starte Anonymisierung...")

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, vorname: true, nachname: true, email: true },
  })

  console.log(`📋 ${mitarbeiter.length} Mitarbeiter gefunden`)

  if (mitarbeiter.length === 0) {
    console.log("Nichts zu tun.")
    return
  }

  const usedEmails = new Set<string>()
  let i = 0
  let countMitarbeiter = 0
  let countUser = 0

  for (const m of mitarbeiter) {
    const fake = FAKE_NAMES[i % FAKE_NAMES.length]
    const suffix = Math.floor(i / FAKE_NAMES.length)
    const slug = `${slugify(fake.vorname)}.${slugify(fake.nachname)}${suffix > 0 ? suffix : ""}`
    let email = `${slug}@demo-forstmanager.de`

    // Falls Email schon belegt (User-Tabelle hat unique-constraint)
    while (usedEmails.has(email)) {
      email = `${slug}.${Date.now()}@demo-forstmanager.de`
    }
    usedEmails.add(email)

    await prisma.mitarbeiter.update({
      where: { id: m.id },
      data: {
        vorname: fake.vorname,
        nachname: fake.nachname,
        email,
      },
    })
    countMitarbeiter++

    if (m.userId) {
      try {
        await prisma.user.update({
          where: { id: m.userId },
          data: {
            name: `${fake.vorname} ${fake.nachname}`,
            email,
          },
        })
        countUser++
      } catch (e) {
        console.warn(`⚠️  User ${m.userId} konnte nicht aktualisiert werden:`, (e as Error).message)
      }
    }

    i++
  }

  console.log(`✅ ${countMitarbeiter} Mitarbeiter anonymisiert`)
  console.log(`✅ ${countUser} verknüpfte User-Accounts aktualisiert`)

  // Verify
  const sample = await prisma.mitarbeiter.findMany({
    take: 20,
    select: { vorname: true, nachname: true, email: true, rolle: true },
    orderBy: { createdAt: "asc" },
  })
  console.log("\n📊 Sample (erste 20):")
  for (const s of sample) {
    console.log(`  ${s.vorname} ${s.nachname}  <${s.email ?? "-"}>  [${s.rolle}]`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
