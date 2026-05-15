-- Migration: add_foto_model
-- Generated via: prisma migrate diff --from-schema (HEAD) --to-schema (working tree)
-- DO NOT execute on prod without review.

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nextcloudPath" TEXT,
    "caption" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auftragId" TEXT,
    "protokollId" TEXT,
    "mitarbeiterId" TEXT NOT NULL,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Foto_auftragId_idx" ON "Foto"("auftragId");

-- CreateIndex
CREATE INDEX "Foto_mitarbeiterId_idx" ON "Foto"("mitarbeiterId");

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_auftragId_fkey" FOREIGN KEY ("auftragId") REFERENCES "Auftrag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_protokollId_fkey" FOREIGN KEY ("protokollId") REFERENCES "Tagesprotokoll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

