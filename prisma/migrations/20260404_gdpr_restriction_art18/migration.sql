-- Sprint JY: DSGVO Art. 18 - Einschränkung der Verarbeitung
-- Bei Löschantrag für GoBD-pflichtige Daten (Rechnungen):
-- Zugriff einschränken statt löschen

-- Add GDPR restriction fields to Rechnung
ALTER TABLE "Rechnung" ADD COLUMN "gdprRestricted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Rechnung" ADD COLUMN "gdprRestrictedAt" TIMESTAMP(3);
ALTER TABLE "Rechnung" ADD COLUMN "gdprRestrictedBy" TEXT;
ALTER TABLE "Rechnung" ADD COLUMN "gdprRequestId" TEXT;

-- Create GdprRequest table for managing GDPR requests
CREATE TABLE "GdprRequest" (
    "id" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterType" TEXT NOT NULL DEFAULT 'KUNDE',
    "requestType" TEXT NOT NULL,
    "requestReason" TEXT,
    "affectedEntities" JSONB,
    "status" TEXT NOT NULL DEFAULT 'EINGEGANGEN',
    "statusHistory" JSONB,
    "assignedTo" TEXT,
    "internalNotes" TEXT,
    "decision" TEXT,
    "decisionReason" TEXT,
    "decisionAt" TIMESTAMP(3),
    "decisionBy" TEXT,
    "gobdConflict" BOOLEAN NOT NULL DEFAULT false,
    "restrictionApplied" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "correspondenceLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GdprRequest_pkey" PRIMARY KEY ("id")
);

-- Create GdprRequestAuditLog for audit trail
CREATE TABLE "GdprRequestAuditLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedBy" TEXT,
    "performedByName" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdprRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "GdprRequest_status_idx" ON "GdprRequest"("status");
CREATE INDEX "GdprRequest_requesterEmail_idx" ON "GdprRequest"("requesterEmail");
CREATE INDEX "GdprRequest_receivedAt_idx" ON "GdprRequest"("receivedAt");
CREATE INDEX "GdprRequest_dueAt_idx" ON "GdprRequest"("dueAt");
CREATE INDEX "GdprRequestAuditLog_requestId_idx" ON "GdprRequestAuditLog"("requestId");
CREATE INDEX "GdprRequestAuditLog_createdAt_idx" ON "GdprRequestAuditLog"("createdAt");

-- Add foreign key from Rechnung to GdprRequest
ALTER TABLE "Rechnung" ADD CONSTRAINT "Rechnung_gdprRequestId_fkey" 
    FOREIGN KEY ("gdprRequestId") REFERENCES "GdprRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
