-- BS-MKT-01 Phase 2: Baumschule Selbst-Registrierung
-- Neue Felder: status, lieferBundeslaender, zufZertifiziert

ALTER TABLE "Baumschule" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'aktiv';
ALTER TABLE "Baumschule" ADD COLUMN IF NOT EXISTS "lieferBundeslaender" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Baumschule" ADD COLUMN IF NOT EXISTS "zufZertifiziert" BOOLEAN NOT NULL DEFAULT false;

-- Index für Filterung nach Status (Admin-Übersicht "neue Anträge")
CREATE INDEX IF NOT EXISTS "Baumschule_status_idx" ON "Baumschule"("status");
