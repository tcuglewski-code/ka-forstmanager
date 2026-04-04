-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'cancelled', 'grace_period', 'archived', 'deleted');

-- AlterTable Tenant: Add churn management fields
ALTER TABLE "Tenant" ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "Tenant" ADD COLUMN "contractEndDate" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "graceEndDate" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "cancelledBy" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "cancellationNote" TEXT;
