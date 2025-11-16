import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordResponseDto } from './dto/medical-record-response.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createMedicalRecordDto: CreateMedicalRecordDto,
    userId: string,
  ): Promise<MedicalRecordResponseDto> {
    // Проверяем, что приём существует
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: createMedicalRecordDto.appointmentId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Приём не найден');
    }

    // Проверяем, что пользователь является врачом этого приёма или администратором
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      appointment.doctorId !== userId &&
      !['developer', 'rootUser', 'admin'].includes(user?.role || '')
    ) {
      throw new ForbiddenException(
        'Недостаточно прав для создания медицинской записи',
      );
    }

    // Проверяем, что запись для этого приёма ещё не создана
    const existingRecord = await this.prisma.medicalRecord.findFirst({
      where: { appointmentId: createMedicalRecordDto.appointmentId },
    });

    if (existingRecord) {
      throw new BadRequestException(
        'Медицинская запись для этого приёма уже существует',
      );
    }

    // Проверяем, что patientId и doctorId соответствуют приёму
    if (
      appointment.patientId !== createMedicalRecordDto.patientId ||
      appointment.doctorId !== createMedicalRecordDto.doctorId
    ) {
      throw new BadRequestException(
        'Пациент или врач не соответствуют приёму',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const medicalRecord = await (this.prisma as any).medicalRecord.create({
      data: {
        appointmentId: createMedicalRecordDto.appointmentId,
        patientId: createMedicalRecordDto.patientId,
        doctorId: createMedicalRecordDto.doctorId,
        createdById: userId, // Сохраняем ID пользователя, который создал запись
        diagnosis: createMedicalRecordDto.diagnosis,
        treatment: createMedicalRecordDto.treatment,
        notes: createMedicalRecordDto.notes,
        recommendations: createMedicalRecordDto.recommendations,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        attachments: {
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
        },
      },
    });

    return this.mapToDto(medicalRecord);
  }

  async findAll(
    userId: string,
    filters?: {
      patientId?: string;
      doctorId?: string;
      appointmentId?: string;
    },
  ): Promise<MedicalRecordResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Пациенты видят только свои записи, врачи - свои, администраторы - все
    const where: any = {};

    if (user?.role === 'patient') {
      where.patientId = userId;
    } else if (user?.role === 'doctor') {
      where.doctorId = userId;
    }
    // Для администраторов, developer, rootUser - нет ограничений

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters?.doctorId) {
      where.doctorId = filters.doctorId;
    }
    if (filters?.appointmentId) {
      where.appointmentId = filters.appointmentId;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const medicalRecords = await (this.prisma as any).medicalRecord.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        attachments: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return medicalRecords.map((record: any) => this.mapToDto(record));
  }

  async findOne(id: string, userId: string): Promise<MedicalRecordResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const medicalRecord = await (this.prisma as any).medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        attachments: {
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
        },
      },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Медицинская запись не найдена');
    }

    // Проверяем права доступа
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      medicalRecord.patientId !== userId &&
      medicalRecord.doctorId !== userId &&
      !['developer', 'rootUser', 'admin'].includes(user?.role || '')
    ) {
      throw new ForbiddenException('Недостаточно прав для просмотра записи');
    }

    return this.mapToDto(medicalRecord);
  }

  async update(
    id: string,
    updateMedicalRecordDto: UpdateMedicalRecordDto,
    userId: string,
  ): Promise<MedicalRecordResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const medicalRecord = await (this.prisma as any).medicalRecord.findUnique({
      where: { id },
      include: {
        appointment: true,
      },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Медицинская запись не найдена');
    }

    // Проверяем права доступа - только врач, создавший запись, или администратор
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      medicalRecord.doctorId !== userId &&
      !['developer', 'rootUser', 'admin'].includes(user?.role || '')
    ) {
      throw new ForbiddenException(
        'Недостаточно прав для редактирования записи',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const updated = await (this.prisma as any).medicalRecord.update({
      where: { id },
      data: {
        diagnosis: updateMedicalRecordDto.diagnosis,
        treatment: updateMedicalRecordDto.treatment,
        notes: updateMedicalRecordDto.notes,
        recommendations: updateMedicalRecordDto.recommendations,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
    });

    return this.mapToDto(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const medicalRecord = await this.prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Медицинская запись не найдена');
    }

    // Проверяем права доступа - только врач, создавший запись, или администратор
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      medicalRecord.doctorId !== userId &&
      !['developer', 'rootUser', 'admin'].includes(user?.role || '')
    ) {
      throw new ForbiddenException(
        'Недостаточно прав для удаления записи',
      );
    }

    await this.prisma.medicalRecord.delete({
      where: { id },
    });
  }

  private mapToDto(medicalRecord: any): MedicalRecordResponseDto {
    return {
      id: medicalRecord.id,
      appointmentId: medicalRecord.appointmentId,
      patientId: medicalRecord.patientId,
      doctorId: medicalRecord.doctorId,
      createdById: medicalRecord.createdById,
      diagnosis: medicalRecord.diagnosis,
      treatment: medicalRecord.treatment,
      notes: medicalRecord.notes,
      recommendations: medicalRecord.recommendations,
      createdAt: medicalRecord.createdAt.toISOString(),
      updatedAt: medicalRecord.updatedAt.toISOString(),
      patient: medicalRecord.patient
        ? {
            id: medicalRecord.patient.id,
            firstName: medicalRecord.patient.firstName,
            lastName: medicalRecord.patient.lastName,
            email: medicalRecord.patient.email,
          }
        : undefined,
      doctor: medicalRecord.doctor
        ? {
            id: medicalRecord.doctor.id,
            firstName: medicalRecord.doctor.firstName,
            lastName: medicalRecord.doctor.lastName,
            email: medicalRecord.doctor.email,
          }
        : undefined,
      createdBy: medicalRecord.createdBy
        ? {
            id: medicalRecord.createdBy.id,
            firstName: medicalRecord.createdBy.firstName,
            lastName: medicalRecord.createdBy.lastName,
            email: medicalRecord.createdBy.email,
          }
        : undefined,
      appointment: medicalRecord.appointment
        ? {
            id: medicalRecord.appointment.id,
            startTime: medicalRecord.appointment.startTime.toISOString(),
            endTime: medicalRecord.appointment.endTime.toISOString(),
            status: medicalRecord.appointment.status,
          }
        : undefined,
    };
  }
}

