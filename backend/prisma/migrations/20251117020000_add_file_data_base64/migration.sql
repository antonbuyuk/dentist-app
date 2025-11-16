-- AlterTable
ALTER TABLE "file_attachments" ADD COLUMN "fileData" TEXT;
ALTER TABLE "file_attachments" ALTER COLUMN "filePath" DROP NOT NULL;

