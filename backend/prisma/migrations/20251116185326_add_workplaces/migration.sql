-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "workplaceId" TEXT;

-- CreateTable
CREATE TABLE "workplaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "location" TEXT,
    "equipment" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workplaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_workplaces" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_workplaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_workplaces_doctorId_idx" ON "doctor_workplaces"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_workplaces_workplaceId_idx" ON "doctor_workplaces"("workplaceId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_workplaces_doctorId_workplaceId_key" ON "doctor_workplaces"("doctorId", "workplaceId");

-- CreateIndex
CREATE INDEX "appointments_workplaceId_idx" ON "appointments"("workplaceId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_workplaces" ADD CONSTRAINT "doctor_workplaces_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_workplaces" ADD CONSTRAINT "doctor_workplaces_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
