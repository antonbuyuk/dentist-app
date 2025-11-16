/*
  Warnings:

  - You are about to drop the `doctors` table. If the table is not empty, all the data it contains will be lost.

*/
-- Step 1: Удаляем внешние ключи перед обновлением данных
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_doctorId_fkey";

ALTER TABLE "doctor_workplaces" DROP CONSTRAINT IF EXISTS "doctor_workplaces_doctorId_fkey";

ALTER TABLE "doctors" DROP CONSTRAINT IF EXISTS "doctors_userId_fkey";

-- Step 2: Обновляем appointments.doctorId на users.id через doctors.userId
-- Удаляем записи, у которых нет связанного userId
DELETE FROM "appointments"
WHERE "doctorId" IN (
  SELECT d."id" FROM "doctors" d WHERE d."userId" IS NULL
);

-- Обновляем оставшиеся записи
UPDATE "appointments" a
SET "doctorId" = d."userId"
FROM "doctors" d
WHERE a."doctorId" = d."id" AND d."userId" IS NOT NULL;

-- Step 3: Обновляем doctor_workplaces.doctorId на users.id через doctors.userId
-- Удаляем записи, у которых нет связанного userId
DELETE FROM "doctor_workplaces"
WHERE "doctorId" IN (
  SELECT d."id" FROM "doctors" d WHERE d."userId" IS NULL
);

-- Обновляем оставшиеся записи
UPDATE "doctor_workplaces" dw
SET "doctorId" = d."userId"
FROM "doctors" d
WHERE dw."doctorId" = d."id" AND d."userId" IS NOT NULL;

-- Step 4: Удаляем таблицу doctors
DROP TABLE "doctors";

-- Step 5: Добавляем новые внешние ключи на users
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_workplaces" ADD CONSTRAINT "doctor_workplaces_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


