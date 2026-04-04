-- Sprint GB-01: GoBD-Compliance - Rechnungs-Lock und Audit-Log
-- AlterTable: Füge Lock-Felder zu Rechnung hinzu
ALTER TABLE "Rechnung" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);
ALTER TABLE "Rechnung" ADD COLUMN IF NOT EXISTS "lockedBy" TEXT;
ALTER TABLE "Rechnung" ADD COLUMN IF NOT EXISTS "lockReason" TEXT DEFAULT 'GoBD-Compliance';

-- CreateTable: RechnungAuditLog für Revisionssicherheit
CREATE TABLE IF NOT EXISTS "RechnungAuditLog" (
    "id" TEXT NOT NULL,
    "rechnungId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RechnungAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indizes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS "RechnungAuditLog_rechnungId_idx" ON "RechnungAuditLog"("rechnungId");
CREATE INDEX IF NOT EXISTS "RechnungAuditLog_createdAt_idx" ON "RechnungAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RechnungAuditLog" ADD CONSTRAINT "RechnungAuditLog_rechnungId_fkey" FOREIGN KEY ("rechnungId") REFERENCES "Rechnung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
