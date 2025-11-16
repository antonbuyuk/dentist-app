import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
    appointmentData?: {
      date: string;
      time: string;
      doctorName?: string;
      patientName?: string;
    },
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        appointmentId: createNotificationDto.appointmentId,
      },
    });

    // Отправляем email, если есть данные о приёме
    if (appointmentData) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: createNotificationDto.userId },
          select: { email: true, firstName: true, lastName: true },
        });

        if (user?.email) {
          const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          const notificationType = createNotificationDto.type.replace('appointment_', '') as 'created' | 'updated' | 'cancelled' | 'reminder';

          await this.emailService.sendAppointmentNotification(
            user.email,
            userName,
            notificationType,
            appointmentData,
          );
        }
      } catch (error) {
        // Логируем ошибку, но не прерываем создание уведомления в БД
        console.error('Ошибка отправки email:', error);
      }
    }

    return this.mapToDto(notification);
  }

  async findAll(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Ограничиваем последними 100 уведомлениями
    });

    return notifications.map((n) => this.mapToDto(n));
  }

  async findUnread(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => this.mapToDto(n));
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(
    userId: string,
    markReadDto: MarkReadDto,
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: markReadDto.ids },
        userId, // Убеждаемся, что уведомления принадлежат пользователю
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Уведомление не найдено');
    }

    await this.prisma.notification.delete({
      where: { id },
    });
  }

  private mapToDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      appointmentId: notification.appointmentId ?? undefined,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}

