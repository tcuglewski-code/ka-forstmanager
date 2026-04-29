/**
 * Seed Security Test Accounts
 * Sprint SC-03: Create test accounts for security audits
 *
 * Run with: DATABASE_URL="..." npx tsx scripts/seed-security-accounts.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, log: ['error'] })

const SECURITY_ACCOUNTS = [
  {
    name: 'Security Admin',
    email: 'security-admin@forstmanager.de',
    username: 'security-admin',
    role: 'ka_admin',
  },
  {
    name: 'Security GF',
    email: 'security-gf@forstmanager.de',
    username: 'security-gf',
    role: 'ka_gruppenfuehrer',
  },
  {
    name: 'Security MA',
    email: 'security-ma@forstmanager.de',
    username: 'security-ma',
    role: 'ka_mitarbeiter',
  },
]

const PASSWORD = 'SecurityTest2026!'

async function main() {
  console.log('Creating security test accounts...\n')

  const passwordHash = await bcrypt.hash(PASSWORD, 12)

  for (const account of SECURITY_ACCOUNTS) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: account.email },
      })

      if (existing) {
        console.log(`  [SKIP] ${account.email} already exists (id: ${existing.id})`)
        continue
      }

      const user = await prisma.user.create({
        data: {
          name: account.name,
          email: account.email,
          username: account.username,
          password: passwordHash,
          role: account.role,
          active: true,
          mustChangePassword: false,
        },
      })

      console.log(`  [OK] Created ${account.email} (role: ${account.role}, id: ${user.id})`)
    } catch (error) {
      console.error(`  [ERR] Failed to create ${account.email}:`, error)
    }
  }

  console.log('\nDone! Test credentials:')
  console.log('  Email: security-admin@forstmanager.de / security-gf@forstmanager.de / security-ma@forstmanager.de')
  console.log('  Password: SecurityTest2026!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
