import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const DB_URL = 'postgresql://neondb_owner:npg_1GXdqethC2bJ@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/ForstManagerKADB?sslmode=require'
const adapter = new PrismaPg({ connectionString: DB_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const ohneAccount = await prisma.mitarbeiter.findMany({
    where: { OR: [{ userId: null }, { userId: '' }] }
  })

  console.log(`${ohneAccount.length} Mitarbeiter ohne Account`)

  for (const m of ohneAccount) {
    if (!m.email && !m.vorname) continue

    const email = m.email || `${m.vorname?.toLowerCase()}.${m.nachname?.toLowerCase()}@ka-intern.de`
    const gj = m.geburtsdatum ? new Date(m.geburtsdatum).getFullYear() : '2024'
    const pw = `${m.vorname || 'MA'}${gj}!`
    const hash = await bcrypt.hash(pw, 10)

    const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null)
    let user = existing
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `${m.vorname || ''} ${m.nachname || ''}`.trim(),
          email,
          password: hash,
          role: m.rolle?.includes('führer') ? 'ka_gruppenführer' : 'ka_mitarbeiter',
          active: true,
        }
      })
    }

    await prisma.mitarbeiter.update({ where: { id: m.id }, data: { userId: user.id } })
    console.log(`✓ ${m.vorname} ${m.nachname} → ${email} (PW: ${pw})`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
