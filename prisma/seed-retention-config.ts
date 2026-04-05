import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const retentionDefaults = [
  {
    dataType: "gps_logs",
    retentionDays: 30,
    description: "GPS-Koordinaten und Tracks (Tagesprotokolle, Abnahmen, ErnteEinsätze, SOS)",
  },
  {
    dataType: "temp_files",
    retentionDays: 7,
    description: "Temporäre Dateien und abgelaufene ExportRequests",
  },
  {
    dataType: "audit_logs",
    retentionDays: 365,
    description: "ActivityLog, AuftragLog, RechnungAuditLog (GoBD-konform)",
  },
  {
    dataType: "pd_access_logs",
    retentionDays: 90,
    description: "DSGVO-Zugriffsprotokolle auf personenbezogene Daten",
  },
]

async function main() {
  for (const config of retentionDefaults) {
    await prisma.retentionConfig.upsert({
      where: { dataType: config.dataType },
      update: {
        retentionDays: config.retentionDays,
        description: config.description,
      },
      create: config,
    })
    console.log(`✓ RetentionConfig: ${config.dataType} = ${config.retentionDays} Tage`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
