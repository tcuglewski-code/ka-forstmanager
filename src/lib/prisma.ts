import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

/**
 * Models that support soft-delete via deletedAt field.
 * When delete is called on these models, it is intercepted and
 * converted to an update setting deletedAt = new Date().
 */
const SOFT_DELETE_MODELS = [
  "User",
  "Mitarbeiter",
  "Auftrag",
  "LagerArtikel",
  "Dokument",
  "Kontakt",
  "Rechnung",
] as const

type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number]

function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return (SOFT_DELETE_MODELS as readonly string[]).includes(model)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any }

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const base = new PrismaClient({ adapter, log: ["error"] })

  // MR: Soft-Delete Interceptor via $extends (Prisma 7+ / pg adapter compatible)
  return base.$extends({
    query: {
      $allModels: {
        async delete({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            // Convert delete to soft-delete (set deletedAt)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx = (globalForPrisma.prisma as any)[
              model.charAt(0).toLowerCase() + model.slice(1)
            ]
            return ctx.update({
              ...args,
              data: { deletedAt: new Date() },
            })
          }
          return query(args)
        },
        async deleteMany({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            // Convert deleteMany to updateMany with deletedAt
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx = (globalForPrisma.prisma as any)[
              model.charAt(0).toLowerCase() + model.slice(1)
            ]
            return ctx.updateMany({
              ...args,
              data: { deletedAt: new Date() },
            })
          }
          return query(args)
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
