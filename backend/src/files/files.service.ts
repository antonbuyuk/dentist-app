import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async createFile(
    file: Express.Multer.File,
    medicalRecordId: string | null,
    userId: string,
    description?: string,
  ) {
    // Проверяем, что файл является изображением
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Разрешена загрузка только изображений');
    }

    // Проверяем размер файла (максимум 5MB для base64, так как base64 увеличивает размер на ~33%)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Размер файла не должен превышать 5MB');
    }

    // Конвертируем файл в base64 формат data:image
    const base64Data = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64Data}`;

    // Сохраняем информацию о файле в БД с base64 данными
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const fileAttachment = await (this.prisma as any).fileAttachment.create({
      data: {
        medicalRecordId: medicalRecordId || null,
        userId,
        fileName: file.originalname,
        filePath: null, // Больше не используем файловую систему
        fileData: dataUri, // Сохраняем base64 данные
        fileSize: file.size,
        mimeType: file.mimetype,
        description: description || null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return fileAttachment;
  }

  async findAll(medicalRecordId?: string, userId?: string) {
    const where: any = {};

    if (medicalRecordId) {
      where.medicalRecordId = medicalRecordId;
    }

    if (userId) {
      where.userId = userId;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const files = await (this.prisma as any).fileAttachment.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return files;
  }

  async findOne(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const file = await (this.prisma as any).fileAttachment.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    return file;
  }

  getFileData(file: any): string {
    // Если есть base64 данные, возвращаем их
    if (file.fileData) {
      return file.fileData;
    }

    // Обратная совместимость: если есть filePath, читаем с диска
    if (file.filePath) {
      const fullPath = path.join(process.cwd(), file.filePath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const base64Data = buffer.toString('base64');
        return `data:${file.mimeType};base64,${base64Data}`;
      }
    }

    throw new NotFoundException('Файл не найден');
  }

  async deleteFile(id: string, userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const file = await (this.prisma as any).fileAttachment.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    // Проверяем права доступа - только загрузивший файл или администратор
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      file.userId !== userId &&
      !['developer', 'rootUser', 'admin'].includes(user?.role || '')
    ) {
      throw new ForbiddenException('Недостаточно прав для удаления файла');
    }

    // Удаляем файл с диска
    const fullPath = path.join(process.cwd(), file.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Удаляем запись из БД
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await (this.prisma as any).fileAttachment.delete({
      where: { id },
    });
  }

  async updateFileDescription(id: string, description: string, userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const file = await (this.prisma as any).fileAttachment.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    // Проверяем права доступа
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      file.userId !== userId &&
      !['developer', 'rootUser', 'admin'].includes(user?.role || '')
    ) {
      throw new ForbiddenException(
        'Недостаточно прав для редактирования файла',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (this.prisma as any).fileAttachment.update({
      where: { id },
      data: { description },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateFileMedicalRecord(
    id: string,
    medicalRecordId: string,
    userId: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const file = await (this.prisma as any).fileAttachment.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    // Проверяем права доступа
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      file.userId !== userId &&
      !['developer', 'rootUser', 'admin'].includes(user?.role || '')
    ) {
      throw new ForbiddenException(
        'Недостаточно прав для редактирования файла',
      );
    }

    // Проверяем, что медицинская запись существует
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const medicalRecord = await (this.prisma as any).medicalRecord.findUnique({
      where: { id: medicalRecordId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Медицинская запись не найдена');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (this.prisma as any).fileAttachment.update({
      where: { id },
      data: { medicalRecordId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
