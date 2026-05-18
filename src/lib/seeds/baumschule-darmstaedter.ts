// Seed: Darmstädter Forstbaumschulen Sortiment (Beispiel)
// Verwendung:
//   npx tsx src/lib/seeds/baumschule-darmstaedter.ts
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, log: ["error"] })

const BAUMSCHULE_NAME = "Darmstädter Forstbaumschulen"

type PreisEintrag = {
  baumart: string
  sorte: string
  hkg: string
  fovg: boolean
  preis_pro_100: number
  preis: number       // Preis pro Stk. (Spiegel von preis_pro_100/100)
  einheit: string
  min_bestellung: number
  menge?: number | null
}

// Beispiel-Sortiment (typische Forstbaumarten/Sortimente)
const SORTIMENT: PreisEintrag[] = [
  { baumart: "Stiel-Eiche", sorte: "1+0 20-50cm",      hkg: "818 02", fovg: true,  preis_pro_100: 65,  preis: 0.65, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Stiel-Eiche", sorte: "2+0 50-80cm",      hkg: "818 02", fovg: true,  preis_pro_100: 95,  preis: 0.95, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Trauben-Eiche", sorte: "1+0 20-50cm",    hkg: "817 02", fovg: true,  preis_pro_100: 70,  preis: 0.70, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Rot-Buche", sorte: "1+1 30-60cm",        hkg: "810 02", fovg: true,  preis_pro_100: 75,  preis: 0.75, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Rot-Buche", sorte: "2+2 80-120cm",       hkg: "810 02", fovg: true,  preis_pro_100: 145, preis: 1.45, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Hainbuche", sorte: "1+1 30-60cm",        hkg: "825 02", fovg: true,  preis_pro_100: 70,  preis: 0.70, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Berg-Ahorn", sorte: "1+1 50-80cm",       hkg: "802 02", fovg: true,  preis_pro_100: 80,  preis: 0.80, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Spitz-Ahorn", sorte: "1+1 50-80cm",      hkg: "801 02", fovg: true,  preis_pro_100: 78,  preis: 0.78, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Winter-Linde", sorte: "1+1 50-80cm",     hkg: "841 02", fovg: true,  preis_pro_100: 95,  preis: 0.95, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Vogel-Kirsche", sorte: "1+1 80-120cm",   hkg: "807 02", fovg: true,  preis_pro_100: 110, preis: 1.10, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Esskastanie", sorte: "1+1 50-80cm",      hkg: "811 02", fovg: true,  preis_pro_100: 130, preis: 1.30, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Roterle", sorte: "1+0 50-80cm",          hkg: "803 02", fovg: true,  preis_pro_100: 55,  preis: 0.55, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Sand-Birke", sorte: "1+0 50-80cm",       hkg: "804 02", fovg: true,  preis_pro_100: 50,  preis: 0.50, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Douglasie", sorte: "2+1 30-50cm",        hkg: "853 08", fovg: true,  preis_pro_100: 85,  preis: 0.85, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Fichte", sorte: "2+2 30-50cm",           hkg: "840 08", fovg: true,  preis_pro_100: 55,  preis: 0.55, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Weißtanne", sorte: "2+2 25-40cm",        hkg: "827 08", fovg: true,  preis_pro_100: 95,  preis: 0.95, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Lärche, Europäische", sorte: "1+1 30-60cm", hkg: "836 02", fovg: true, preis_pro_100: 70, preis: 0.70, einheit: "Stk", min_bestellung: 100 },
  { baumart: "Wald-Kiefer", sorte: "1+1 25-40cm",      hkg: "851 02", fovg: true,  preis_pro_100: 45,  preis: 0.45, einheit: "Stk", min_bestellung: 100 },
]

async function main() {
  // Baumschule anlegen oder aktualisieren
  const baumschule = await prisma.baumschule.upsert({
    where: { name: BAUMSCHULE_NAME },
    update: {
      ort: "Darmstadt",
      bundesland: "Hessen",
      aktiv: true,
    },
    create: {
      name: BAUMSCHULE_NAME,
      ort: "Darmstadt",
      bundesland: "Hessen",
      ansprechpartner: null,
      email: null,
      telefon: null,
      aktiv: true,
    },
  })

  console.log(`✓ Baumschule: ${baumschule.name} (${baumschule.id})`)

  let created = 0
  let updated = 0

  for (const eintrag of SORTIMENT) {
    // Wir nutzen ein synthetisches Composite-Match (baumart + sorte + hkg)
    const existing = await prisma.baumschulPreisliste.findFirst({
      where: {
        baumschuleId: baumschule.id,
        baumart: eintrag.baumart,
        sorte: eintrag.sorte,
        hkg: eintrag.hkg,
      },
    })

    if (existing) {
      await prisma.baumschulPreisliste.update({
        where: { id: existing.id },
        data: {
          preis: eintrag.preis,
          preis_pro_100: eintrag.preis_pro_100,
          einheit: eintrag.einheit,
          min_bestellung: eintrag.min_bestellung,
          fovg: eintrag.fovg,
          aktiv: true,
          verfuegbar: true,
        },
      })
      updated++
    } else {
      await prisma.baumschulPreisliste.create({
        data: {
          baumschuleId: baumschule.id,
          baumart: eintrag.baumart,
          sorte: eintrag.sorte,
          hkg: eintrag.hkg,
          fovg: eintrag.fovg,
          preis: eintrag.preis,
          preis_pro_100: eintrag.preis_pro_100,
          einheit: eintrag.einheit,
          min_bestellung: eintrag.min_bestellung,
          aktiv: true,
          verfuegbar: true,
        },
      })
      created++
    }
  }

  console.log(`✓ Sortiment: ${created} neu, ${updated} aktualisiert (${SORTIMENT.length} total)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
