/*
  Warnings:

  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.

*/
-- Step 1: Удаляем внешние ключи перед обновлением данных
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_patientId_fkey";

ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_userId_fkey";

-- Step 2: Обновляем appointments.patientId на users.id через patients.userId
-- Удаляем записи, у которых нет связанного userId
DELETE FROM "appointments"
WHERE "patientId" IN (
  SELECT p."id" FROM "patients" p WHERE p."userId" IS NULL
);

-- Обновляем оставшиеся записи
UPDATE "appointments" a
SET "patientId" = p."userId"
FROM "patients" p
WHERE a."patientId" = p."id" AND p."userId" IS NOT NULL;

-- Step 3: Удаляем таблицу patients
DROP TABLE "patients";

-- Step 4: Добавляем новый внешний ключ на users
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

