-- CreateTable
CREATE TABLE "appointment_suggestions" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "workplaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "appointment_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointment_suggestions_doctorId_idx" ON "appointment_suggestions"("doctorId");

-- CreateIndex
CREATE INDEX "appointment_suggestions_patientId_idx" ON "appointment_suggestions"("patientId");

-- CreateIndex
CREATE INDEX "appointment_suggestions_status_idx" ON "appointment_suggestions"("status");

-- CreateIndex
CREATE INDEX "appointment_suggestions_createdAt_idx" ON "appointment_suggestions"("createdAt");

-- AddForeignKey
ALTER TABLE "appointment_suggestions" ADD CONSTRAINT "appointment_suggestions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_suggestions" ADD CONSTRAINT "appointment_suggestions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_suggestions" ADD CONSTRAINT "appointment_suggestions_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_suggestions" ADD CONSTRAINT "appointment_suggestions_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

