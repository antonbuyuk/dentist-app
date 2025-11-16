import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly appointmentRemindersService: AppointmentRemindersService,
  ) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.notificationsService.findAll(req.user.id);
  }

  @Get('unread')
  async findUnread(@Request() req: any) {
    return this.notificationsService.findUnread(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch('mark-read')
  async markAsRead(@Request() req: any, @Body() markReadDto: MarkReadDto) {
    await this.notificationsService.markAsRead(req.user.id, markReadDto);
    return { message: 'Уведомления отмечены как прочитанные' };
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'Все уведомления отмечены как прочитанные' };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.delete(id, req.user.id);
    return { message: 'Уведомление удалено' };
  }

  @Post('check-reminders')
  async checkReminders(@Request() req: any) {
    // Только для администраторов и разработчиков
    const allowedRoles = ['developer', 'rootUser', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return { message: 'Недостаточно прав' };
    }

    await this.appointmentRemindersService.checkUpcomingAppointments();
    return { message: 'Проверка напоминаний выполнена' };
  }
}
