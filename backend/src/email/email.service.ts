import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendAppointmentNotification(
    to: string,
    userName: string,
    type: 'created' | 'updated' | 'cancelled' | 'reminder',
    appointmentData: {
      date: string;
      time: string;
      doctorName?: string;
      patientName?: string;
    },
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const emailEnabledValue = this.configService.get<string>(
      'EMAIL_ENABLED',
      'false',
    );
    const isEmailEnabled = emailEnabledValue === 'true';

    if (!isEmailEnabled) {
      this.logger.debug('Email отправка отключена (EMAIL_ENABLED=false)');
      return;
    }

    try {
      let subject = '';
      let template = '';

      switch (type) {
        case 'created':
          subject = 'Новый приём создан';
          template = `
            <h2>Здравствуйте, ${userName}!</h2>
            <p>У вас запланирован новый приём:</p>
            <ul>
              <li><strong>Дата:</strong> ${appointmentData.date}</li>
              <li><strong>Время:</strong> ${appointmentData.time}</li>
              ${appointmentData.doctorName ? `<li><strong>Врач:</strong> ${appointmentData.doctorName}</li>` : ''}
              ${appointmentData.patientName ? `<li><strong>Пациент:</strong> ${appointmentData.patientName}</li>` : ''}
            </ul>
            <p>Пожалуйста, не забудьте о приёме.</p>
          `;
          break;
        case 'updated':
          subject = 'Приём изменён';
          template = `
            <h2>Здравствуйте, ${userName}!</h2>
            <p>Ваш приём был изменён:</p>
            <ul>
              <li><strong>Новая дата:</strong> ${appointmentData.date}</li>
              <li><strong>Новое время:</strong> ${appointmentData.time}</li>
              ${appointmentData.doctorName ? `<li><strong>Врач:</strong> ${appointmentData.doctorName}</li>` : ''}
              ${appointmentData.patientName ? `<li><strong>Пациент:</strong> ${appointmentData.patientName}</li>` : ''}
            </ul>
            <p>Пожалуйста, проверьте новое время приёма.</p>
          `;
          break;
        case 'cancelled':
          subject = 'Приём отменён';
          template = `
            <h2>Здравствуйте, ${userName}!</h2>
            <p>К сожалению, ваш приём был отменён:</p>
            <ul>
              <li><strong>Дата:</strong> ${appointmentData.date}</li>
              <li><strong>Время:</strong> ${appointmentData.time}</li>
            </ul>
            <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нами.</p>
          `;
          break;
        case 'reminder':
          subject = 'Напоминание о приёме';
          template = `
            <h2>Здравствуйте, ${userName}!</h2>
            <p>Напоминаем вам о предстоящем приёме:</p>
            <ul>
              <li><strong>Дата:</strong> ${appointmentData.date}</li>
              <li><strong>Время:</strong> ${appointmentData.time}</li>
              ${appointmentData.doctorName ? `<li><strong>Врач:</strong> ${appointmentData.doctorName}</li>` : ''}
              ${appointmentData.patientName ? `<li><strong>Пациент:</strong> ${appointmentData.patientName}</li>` : ''}
            </ul>
            <p>Пожалуйста, не забудьте о приёме!</p>
          `;
          break;
      }

      await this.mailerService.sendMail({
        to,
        subject,
        html: template,
      });

      this.logger.log(`Email отправлен успешно: ${to} (${type})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Ошибка отправки email: ${errorMessage}`, errorStack);
      // Не выбрасываем ошибку, чтобы не прерывать создание уведомления в БД
    }
  }
}
