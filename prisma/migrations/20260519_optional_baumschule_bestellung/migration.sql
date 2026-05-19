-- Make baumschuleId nullable and menge default to 0 for incoming wizard requests
ALTER TABLE "BaumschulBestellung" DROP CONSTRAINT IF EXISTS "BaumschulBestellung_baumschuleId_fkey";

ALTER TABLE "BaumschulBestellung" ALTER COLUMN "baumschuleId" DROP NOT NULL;
ALTER TABLE "BaumschulBestellung" ALTER COLUMN "menge" SET DEFAULT 0;

ALTER TABLE "BaumschulBestellung"
  ADD CONSTRAINT "BaumschulBestellung_baumschuleId_fkey"
  FOREIGN KEY ("baumschuleId") REFERENCES "Baumschule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for filtering by status (admin list)
CREATE INDEX IF NOT EXISTS "BaumschulBestellung_status_idx" ON "BaumschulBestellung"("status");
CREATE INDEX IF NOT EXISTS "BaumschulBestellung_baumschuleId_idx" ON "BaumschulBestellung"("baumschuleId");
