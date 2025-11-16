import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class AppointmentRemindersService {
  private readonly logger = new Logger(AppointmentRemindersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Проверяет предстоящие приёмы и создаёт напоминания за 24 часа
   * Запускается каждые 6 часов
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkUpcomingAppointments() {
    this.logger.log('Проверка предстоящих приёмов для напоминаний...');

    const now = new Date();
    const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 часа
    const reminderWindowStart = new Date(
      reminderTime.getTime() - 6 * 60 * 60 * 1000,
    ); // -6 часов от целевого времени
    const reminderWindowEnd = new Date(
      reminderTime.getTime() + 6 * 60 * 60 * 1000,
    ); // +6 часов от целевого времени

    // Находим приёмы, которые начинаются в окне напоминания (24 часа ± 6 часов)
    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
        status: 'scheduled', // Только запланированные приёмы
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    this.logger.log(
      `Найдено ${upcomingAppointments.length} приёмов для проверки`,
    );

    let remindersCreated = 0;

    for (const appointment of upcomingAppointments) {
      // Проверяем, не было ли уже создано напоминание для этого приёма
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const existingReminder = await (
        this.prisma as any
      ).notification.findFirst({
        where: {
          appointmentId: appointment.id,
          type: 'appointment_reminder',
        },
      });

      if (existingReminder) {
        continue; // Пропускаем, если напоминание уже есть
      }

      // Проверяем, что приём начинается примерно через 24 часа (±6 часов)
      const timeUntilAppointment =
        appointment.startTime.getTime() - now.getTime();
      const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);

      // Создаём напоминание только если приём начинается через 18-30 часов
      if (hoursUntilAppointment >= 18 && hoursUntilAppointment <= 30) {
        await this.createReminder(appointment);
        remindersCreated++;
      }
    }

    this.logger.log(`Создано ${remindersCreated} напоминаний`);
  }

  /**
   * Создаёт напоминание для приёма
   */
  private async createReminder(appointment: any): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const patientName = appointment.patient
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
      : 'Пациент';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const doctorName = appointment.doctor
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `${appointment.doctor.firstName || ''} ${appointment.doctor.lastName || ''}`.trim()
      : 'Врач';

    // Создаём напоминание для пациента
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const patientId = appointment.patientId;
    if (patientId) {
      await this.notificationsService.create(
        {
          userId: patientId as string,
          type: 'appointment_reminder',
          title: 'Напоминание о приёме',
          message: `Напоминание: у вас запланирован приём завтра ${formattedDate} в ${formattedTime}. Врач: ${doctorName}.`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          appointmentId: appointment.id as string,
        },
        {
          date: formattedDate,
          time: formattedTime,
          doctorName,
        },
      );
    }

    // Создаём напоминание для врача
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const doctorId = appointment.doctorId;
    if (doctorId) {
      await this.notificationsService.create(
        {
          userId: doctorId as string,
          type: 'appointment_reminder',
          title: 'Напоминание о приёме',
          message: `Напоминание: у вас запланирован приём с пациентом ${patientName} завтра ${formattedDate} в ${formattedTime}.`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          appointmentId: appointment.id as string,
        },
        {
          date: formattedDate,
          time: formattedTime,
          patientName,
        },
      );
    }
  }
}
