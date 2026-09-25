-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "submitted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "blur_data_url" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "claim_requests" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "relationship" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "evidence_key" TEXT,
    "evidence_type" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "decision_note" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claim_requests_status_created_at_idx" ON "claim_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "claim_requests_business_id_idx" ON "claim_requests"("business_id");

-- CreateIndex
CREATE INDEX "claim_requests_user_id_idx" ON "claim_requests"("user_id");

-- AddForeignKey
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
