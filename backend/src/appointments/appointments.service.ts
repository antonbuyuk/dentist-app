import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const startTime = new Date(createAppointmentDto.startTime);
    const endTime = new Date(createAppointmentDto.endTime);

    // Валидация времени
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Время окончания должно быть позже времени начала',
      );
    }

    // Проверка существования пользователя с ролью patient
    const patient = await this.prisma.user.findFirst({
      where: {
        id: createAppointmentDto.patientId,
        role: 'patient',
      },
    });

    // Проверка существования пользователя с ролью doctor
    const doctor = await this.prisma.user.findFirst({
      where: {
        id: createAppointmentDto.doctorId,
        role: 'doctor',
      },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createAppointmentDto.patientId} not found`,
      );
    }

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${createAppointmentDto.doctorId} not found`,
      );
    }

    // Проверка пересечений времени для врача
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: createAppointmentDto.doctorId,
        status: { not: 'cancelled' },
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
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Врач уже занят в это время');
    }

    // Проверка пересечений времени для пациента
    const conflictingPatientAppointment =
      await this.prisma.appointment.findFirst({
        where: {
          patientId: createAppointmentDto.patientId,
          status: { not: 'cancelled' },
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
        },
      });

    if (conflictingPatientAppointment) {
      throw new ConflictException('У пациента уже есть приём в это время');
    }

    // Создаём родительский приём

    const parentAppointment = await this.prisma.appointment.create({
      data: {
        patientId: createAppointmentDto.patientId,
        doctorId: createAppointmentDto.doctorId,
        startTime,
        endTime,
        notes: createAppointmentDto.notes,
        status: createAppointmentDto.status || 'scheduled',
        recurrenceRule: createAppointmentDto.recurrenceRule || null,
        recurrenceEndDate: createAppointmentDto.recurrenceEndDate
          ? new Date(createAppointmentDto.recurrenceEndDate)
          : null,
      } as any,
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Если указано повторение, генерируем дочерние приёмы
    if (
      createAppointmentDto.recurrenceRule &&
      createAppointmentDto.recurrenceEndDate
    ) {
      await this.generateRecurringAppointments(
        parentAppointment,
        createAppointmentDto.recurrenceRule,
        new Date(createAppointmentDto.recurrenceEndDate),
      );
    }

    // Создаём уведомления для пациента и врача
    await this.createAppointmentNotifications(parentAppointment, 'created');

    return this.mapToDto(parentAppointment);
  }

  /**
   * Генерирует повторяющиеся приёмы на основе родительского приёма
   */
  private async generateRecurringAppointments(
    parentAppointment: any,
    recurrenceRule: string,
    endDate: Date,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const currentStart = new Date(parentAppointment.startTime);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const currentEnd = new Date(parentAppointment.endTime);

    const appointmentsToCreate: any[] = [];

    // Генерируем приёмы до даты окончания
    while (currentStart <= endDate) {
      // Пропускаем первый приём (он уже создан как родительский)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (currentStart.getTime() !== parentAppointment.startTime.getTime()) {
        // Проверяем конфликты только для врача (для скорости)
        const hasConflict = await this.prisma.appointment.findFirst({
          where: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            doctorId: parentAppointment.doctorId,
            status: { not: 'cancelled' },
            OR: [
              {
                AND: [
                  { startTime: { lte: currentStart } },
                  { endTime: { gt: currentStart } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: currentEnd } },
                  { endTime: { gte: currentEnd } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: currentStart } },
                  { endTime: { lte: currentEnd } },
                ],
              },
            ],
          },
        });

        // Если нет конфликта, добавляем приём
        if (!hasConflict) {
          appointmentsToCreate.push({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            patientId: parentAppointment.patientId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            doctorId: parentAppointment.doctorId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            workplaceId: parentAppointment.workplaceId,
            startTime: new Date(currentStart),
            endTime: new Date(currentEnd),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            notes: parentAppointment.notes,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            status: parentAppointment.status,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            parentAppointmentId: parentAppointment.id,
          });
        }
      }

      // Переходим к следующей дате в зависимости от правила повторения
      switch (recurrenceRule) {
        case 'daily':
          currentStart.setDate(currentStart.getDate() + 1);
          currentEnd.setDate(currentEnd.getDate() + 1);
          break;
        case 'weekly':
          currentStart.setDate(currentStart.getDate() + 7);
          currentEnd.setDate(currentEnd.getDate() + 7);
          break;
        case 'monthly':
          currentStart.setMonth(currentStart.getMonth() + 1);
          currentEnd.setMonth(currentEnd.getMonth() + 1);
          break;
        default:
          return; // Неизвестное правило повторения
      }
    }

    // Создаём все приёмы одной транзакцией
    if (appointmentsToCreate.length > 0) {
      await this.prisma.appointment.createMany({
        data: appointmentsToCreate,
      });
    }
  }

  async findAll(): Promise<AppointmentResponseDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((a) => this.mapToDto(a));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AppointmentResponseDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((a) => this.mapToDto(a));
  }

  async findOne(id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return this.mapToDto(appointment);
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const updateData: any = {};

    // Обработка обновления patientId
    if (updateAppointmentDto.patientId) {
      // Проверяем, является ли patientId ID пользователя с ролью patient
      const patient = await this.prisma.user.findFirst({
        where: {
          id: updateAppointmentDto.patientId,
          role: 'patient',
        },
      });

      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${updateAppointmentDto.patientId} not found`,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.patientId = updateAppointmentDto.patientId;
    }

    if (updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
      const startTime = updateAppointmentDto.startTime
        ? new Date(updateAppointmentDto.startTime)
        : existing.startTime;

      const endTime = updateAppointmentDto.endTime
        ? new Date(updateAppointmentDto.endTime)
        : existing.endTime;

      if (startTime >= endTime) {
        throw new BadRequestException(
          'Время окончания должно быть позже времени начала',
        );
      }

      // Проверка пересечений (исключая текущий приём)

      const doctorId = updateAppointmentDto.doctorId || existing.doctorId;
      const conflictingAppointment = await this.prisma.appointment.findFirst({
        where: {
          id: { not: id },
          doctorId,
          status: { not: 'cancelled' },
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
        },
      });

      if (conflictingAppointment) {
        throw new ConflictException('Врач уже занят в это время');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.startTime = startTime;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.endTime = endTime;
    }

    // Обработка обновления doctorId
    if (updateAppointmentDto.doctorId) {
      // Проверяем, является ли doctorId ID пользователя с ролью doctor
      const doctor = await this.prisma.user.findFirst({
        where: {
          id: updateAppointmentDto.doctorId,
          role: 'doctor',
        },
      });

      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${updateAppointmentDto.doctorId} not found`,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.doctorId = updateAppointmentDto.doctorId;
    }

    if (updateAppointmentDto.notes !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.notes = updateAppointmentDto.notes;
    }

    if (updateAppointmentDto.status) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.status = updateAppointmentDto.status;
    }

    const appointment = await (this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
      },
    }) as Promise<any>);

    // Определяем тип уведомления
    let notificationType: 'created' | 'updated' | 'cancelled' = 'updated';
    if (updateAppointmentDto.status === 'cancelled' && existing.status !== 'cancelled') {
      notificationType = 'cancelled';
    }

    // Создаём уведомления для пациента и врача
    await this.createAppointmentNotifications(appointment, notificationType);

    return this.mapToDto(appointment);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Создаём уведомления об отмене перед удалением
    await this.createAppointmentNotifications(existing, 'cancelled');

    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  /**
   * Создаёт уведомления для пациента и врача о приёме
   */
  private async createAppointmentNotifications(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appointment: any,
    type: 'created' | 'updated' | 'cancelled',
  ): Promise<void> {
    const startDate = new Date(appointment.startTime);
    const formattedDate = startDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = startDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const patientName = appointment.patient
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
      : 'Пациент';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const doctorName = appointment.doctor
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `${appointment.doctor.firstName || ''} ${appointment.doctor.lastName || ''}`.trim()
      : 'Врач';

    let title = '';
    let message = '';

    switch (type) {
      case 'created':
        title = 'Новый приём создан';
        message = `У вас запланирован приём ${formattedDate} в ${formattedTime}. Врач: ${doctorName}.`;
        break;
      case 'updated':
        title = 'Приём изменён';
        message = `Ваш приём был изменён. Новая дата: ${formattedDate} в ${formattedTime}. Врач: ${doctorName}.`;
        break;
      case 'cancelled':
        title = 'Приём отменён';
        message = `Ваш приём на ${formattedDate} в ${formattedTime} был отменён.`;
        break;
    }

    // Создаём уведомление для пациента
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const patientId = appointment.patientId;
    if (patientId) {
      await this.notificationsService.create(
        {
          userId: patientId,
          type: `appointment_${type}`,
          title,
          message,
          appointmentId: appointment.id,
        },
        {
          date: formattedDate,
          time: formattedTime,
          doctorName,
        },
      );
    }

    // Создаём уведомление для врача
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const doctorId = appointment.doctorId;
    if (doctorId) {
      const doctorTitle = type === 'created'
        ? 'Новый приём назначен'
        : type === 'updated'
          ? 'Приём изменён'
          : 'Приём отменён';
      const doctorMessage = type === 'created'
        ? `Вам назначен приём с пациентом ${patientName} на ${formattedDate} в ${formattedTime}.`
        : type === 'updated'
          ? `Приём с пациентом ${patientName} был изменён. Новая дата: ${formattedDate} в ${formattedTime}.`
          : `Приём с пациентом ${patientName} на ${formattedDate} в ${formattedTime} был отменён.`;

      await this.notificationsService.create(
        {
          userId: doctorId,
          type: `appointment_${type}`,
          title: doctorTitle,
          message: doctorMessage,
          appointmentId: appointment.id,
        },
        {
          date: formattedDate,
          time: formattedTime,
          patientName,
        },
      );
    }
  }

  private mapToDto(appointment: any): AppointmentResponseDto {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: appointment.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      patientId: appointment.patientId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      doctorId: appointment.doctorId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      startTime: appointment.startTime.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      endTime: appointment.endTime.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      notes: appointment.notes ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      status: appointment.status,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      recurrenceRule: appointment.recurrenceRule ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      recurrenceEndDate: appointment.recurrenceEndDate
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          appointment.recurrenceEndDate.toISOString()
        : undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      parentAppointmentId: appointment.parentAppointmentId ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      createdAt: appointment.createdAt.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      updatedAt: appointment.updatedAt.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      patient: appointment.patient
        ? {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            id: appointment.patient.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            firstName: appointment.patient.firstName ?? '',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            lastName: appointment.patient.lastName ?? '',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            email: appointment.patient.email ?? undefined,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            phone: appointment.patient.phone ?? undefined,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            userId: appointment.patient.id, // Для User userId = id
          }
        : undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      doctor: appointment.doctor
        ? {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            id: appointment.doctor.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            firstName: appointment.doctor.firstName ?? '',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            lastName: appointment.doctor.lastName ?? '',

            specialization: undefined, // User не имеет specialization
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            email: appointment.doctor.email ?? undefined,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            phone: appointment.doctor.phone ?? undefined,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            userId: appointment.doctor.id, // Для User userId = id
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            color: appointment.doctor.color ?? undefined,
          }
        : undefined,
    };
  }
}
