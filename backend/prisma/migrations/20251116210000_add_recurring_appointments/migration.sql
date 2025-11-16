-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "recurrenceRule" TEXT;
ALTER TABLE "appointments" ADD COLUMN "recurrenceEndDate" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN "parentAppointmentId" TEXT;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_parentAppointmentId_fkey" FOREIGN KEY ("parentAppointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "appointments_parentAppointmentId_idx" ON "appointments"("parentAppointmentId");

