import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentSuggestionDto } from './dto/create-appointment-suggestion.dto';
import { UpdateAppointmentSuggestionDto } from './dto/update-appointment-suggestion.dto';
import { AppointmentSuggestionResponseDto } from './dto/appointment-suggestion-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentSuggestionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    createDto: CreateAppointmentSuggestionDto,
    doctorId: string,
  ): Promise<AppointmentSuggestionResponseDto> {
    // Проверяем, что врач существует и имеет роль 'doctor'
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, role: true },
    });

    if (!doctor || doctor.role !== 'doctor') {
      throw new ForbiddenException('Только врачи могут создавать предложения приёмов');
    }

    // Проверяем, что пациент существует
    const patient = await this.prisma.user.findUnique({
      where: { id: createDto.patientId },
      select: { id: true, role: true },
    });

    if (!patient || patient.role !== 'patient') {
      throw new BadRequestException('Пациент не найден');
    }

    // Проверяем конфликты времени
    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Время окончания должно быть позже времени начала');
    }

    // Проверяем конфликты с существующими приёмами врача
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
        status: { not: 'cancelled' },
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException('В это время у врача уже есть приём');
    }

    // Создаём предложение
    const suggestion = await this.prisma.appointmentSuggestion.create({
      data: {
        doctorId,
        patientId: createDto.patientId,
        startTime,
        endTime,
        notes: createDto.notes || null,
        workplaceId: createDto.workplaceId || null,
        status: 'pending',
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        workplace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Отправляем уведомления всем администраторам
    await this.notifyAdministrators(suggestion);

    return this.mapToDto(suggestion);
  }

  async findAll(userId: string, userRole: string): Promise<AppointmentSuggestionResponseDto[]> {
    let where: any = {};

    // Врачи видят только свои предложения
    if (userRole === 'doctor') {
      where.doctorId = userId;
    }
    // Администраторы видят все предложения
    else if (!['developer', 'rootUser', 'admin'].includes(userRole)) {
      throw new ForbiddenException('Недостаточно прав для просмотра предложений');
    }

    const suggestions = await this.prisma.appointmentSuggestion.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        workplace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return suggestions.map((s) => this.mapToDto(s));
  }

  async findOne(id: string, userId: string, userRole: string): Promise<AppointmentSuggestionResponseDto> {
    const suggestion = await this.prisma.appointmentSuggestion.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        workplace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!suggestion) {
      throw new NotFoundException('Предложение не найдено');
    }

    // Врачи могут видеть только свои предложения
    if (userRole === 'doctor' && suggestion.doctorId !== userId) {
      throw new ForbiddenException('Недостаточно прав для просмотра этого предложения');
    }

    // Только администраторы могут видеть чужие предложения
    if (!['developer', 'rootUser', 'admin'].includes(userRole) && suggestion.doctorId !== userId) {
      throw new ForbiddenException('Недостаточно прав для просмотра этого предложения');
    }

    return this.mapToDto(suggestion);
  }

  async update(
    id: string,
    updateDto: UpdateAppointmentSuggestionDto,
    userId: string,
    userRole: string,
  ): Promise<AppointmentSuggestionResponseDto> {
    // Только администраторы могут изменять статус предложений
    if (!['developer', 'rootUser', 'admin'].includes(userRole)) {
      throw new ForbiddenException('Только администраторы могут изменять статус предложений');
    }

    const suggestion = await this.prisma.appointmentSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException('Предложение не найдено');
    }

    // Если одобряем предложение, создаём приём
    if (updateDto.status === 'approved' && suggestion.status === 'pending') {
      await this.createAppointmentFromSuggestion(suggestion);
    }

    const updated = await this.prisma.appointmentSuggestion.update({
      where: { id },
      data: {
        status: updateDto.status,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        workplace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Отправляем уведомление врачу о решении
    await this.notifyDoctorAboutDecision(updated);

    return this.mapToDto(updated);
  }

  private async createAppointmentFromSuggestion(suggestion: any): Promise<void> {
    await this.prisma.appointment.create({
      data: {
        patientId: suggestion.patientId,
        doctorId: suggestion.doctorId,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
        notes: suggestion.notes,
        workplaceId: suggestion.workplaceId,
        status: 'scheduled',
      },
    });
  }

  private async notifyAdministrators(suggestion: any): Promise<void> {
    // Находим всех администраторов
    const administrators = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['developer', 'rootUser', 'admin'],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const doctorName = `${suggestion.doctor.firstName || ''} ${suggestion.doctor.lastName || ''}`.trim() || suggestion.doctor.email;
    const patientName = `${suggestion.patient.firstName || ''} ${suggestion.patient.lastName || ''}`.trim() || suggestion.patient.email;

    // Отправляем уведомление каждому администратору
    for (const admin of administrators) {
      await this.notificationsService.create(
        {
          userId: admin.id,
          type: 'system',
          title: 'Новое предложение приёма',
          message: `Врач ${doctorName} предложил приём для пациента ${patientName} на ${new Date(suggestion.startTime).toLocaleString('ru-RU')}`,
        },
      );
    }
  }

  private async notifyDoctorAboutDecision(suggestion: any): Promise<void> {
    const statusLabel = suggestion.status === 'approved' ? 'одобрено' : 'отклонено';
    const reviewerName = suggestion.reviewer
      ? `${suggestion.reviewer.firstName || ''} ${suggestion.reviewer.lastName || ''}`.trim() || suggestion.reviewer.email
      : 'Администратор';

    await this.notificationsService.create(
      {
        userId: suggestion.doctorId,
        type: 'system',
        title: `Предложение приёма ${statusLabel}`,
        message: `Ваше предложение приёма для пациента ${suggestion.patient.firstName} ${suggestion.patient.lastName} на ${new Date(suggestion.startTime).toLocaleString('ru-RU')} было ${statusLabel} администратором ${reviewerName}.`,
      },
    );
  }

  private mapToDto(suggestion: any): AppointmentSuggestionResponseDto {
    return {
      id: suggestion.id,
      doctorId: suggestion.doctorId,
      patientId: suggestion.patientId,
      startTime: suggestion.startTime.toISOString(),
      endTime: suggestion.endTime.toISOString(),
      notes: suggestion.notes,
      status: suggestion.status,
      workplaceId: suggestion.workplaceId,
      createdAt: suggestion.createdAt.toISOString(),
      updatedAt: suggestion.updatedAt.toISOString(),
      reviewedAt: suggestion.reviewedAt?.toISOString() || null,
      reviewedBy: suggestion.reviewedBy || null,
      doctor: suggestion.doctor
        ? {
            id: suggestion.doctor.id,
            firstName: suggestion.doctor.firstName,
            lastName: suggestion.doctor.lastName,
            email: suggestion.doctor.email,
          }
        : undefined,
      patient: suggestion.patient
        ? {
            id: suggestion.patient.id,
            firstName: suggestion.patient.firstName,
            lastName: suggestion.patient.lastName,
            email: suggestion.patient.email,
          }
        : undefined,
      reviewer: suggestion.reviewer
        ? {
            id: suggestion.reviewer.id,
            firstName: suggestion.reviewer.firstName,
            lastName: suggestion.reviewer.lastName,
            email: suggestion.reviewer.email,
          }
        : null,
      workplace: suggestion.workplace
        ? {
            id: suggestion.workplace.id,
            name: suggestion.workplace.name,
          }
        : null,
    };
  }
}

