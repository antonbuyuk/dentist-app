-- AlterTable: добавляем колонку как nullable сначала
ALTER TABLE "medical_records" ADD COLUMN "createdById" TEXT;

-- Update existing records: set createdById to doctorId (assuming doctor created the record)
UPDATE "medical_records" SET "createdById" = "doctorId" WHERE "createdById" IS NULL;

-- Теперь делаем колонку NOT NULL
ALTER TABLE "medical_records" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "medical_records_createdById_idx" ON "medical_records"("createdById");

