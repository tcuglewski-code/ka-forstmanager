-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('pending', 'processing', 'completed', 'expired', 'failed');

-- CreateTable
CREATE TABLE "ExportRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'pending',
    "fileSize" INTEGER,
    "recordCount" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "downloadedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "exportedTypes" TEXT[],

    CONSTRAINT "ExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExportRequest_token_key" ON "ExportRequest"("token");

-- CreateIndex
CREATE INDEX "ExportRequest_tenantId_idx" ON "ExportRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ExportRequest_token_idx" ON "ExportRequest"("token");

-- CreateIndex
CREATE INDEX "ExportRequest_status_idx" ON "ExportRequest"("status");

-- CreateIndex
CREATE INDEX "ExportRequest_expiresAt_idx" ON "ExportRequest"("expiresAt");
