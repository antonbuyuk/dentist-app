import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { memoryStorage } from 'multer';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('medicalRecordId') medicalRecordId?: string,
    @Body('description') description?: string,
    @Request() req?: any,
  ) {
    if (!file) {
      throw new Error('Файл не был загружен');
    }

    return this.filesService.createFile(
      file,
      medicalRecordId || null,
      req.user.id,
      description,
    );
  }

  @Get()
  async findAll(
    @Query('medicalRecordId') medicalRecordId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.filesService.findAll(medicalRecordId, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const file = await this.filesService.findOne(id);
    const dataUri = this.filesService.getFileData(file);

    // Извлекаем base64 данные из data URI
    const base64Data = dataUri.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.send(buffer);
  }

  @Patch(':id/description')
  async updateDescription(
    @Param('id') id: string,
    @Body('description') description: string,
    @Request() req: any,
  ) {
    return this.filesService.updateFileDescription(
      id,
      description,
      req.user.id,
    );
  }

  @Patch(':id/medical-record')
  async updateMedicalRecord(
    @Param('id') id: string,
    @Body('medicalRecordId') medicalRecordId: string,
    @Request() req: any,
  ) {
    return this.filesService.updateFileMedicalRecord(
      id,
      medicalRecordId,
      req.user.id,
    );
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string, @Request() req: any) {
    await this.filesService.deleteFile(id, req.user.id);
    return { message: 'Файл успешно удалён' };
  }
}
