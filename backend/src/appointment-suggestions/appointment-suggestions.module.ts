import { Module } from '@nestjs/common';
import { AppointmentSuggestionsService } from './appointment-suggestions.service';
import { AppointmentSuggestionsController } from './appointment-suggestions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AppointmentSuggestionsController],
  providers: [AppointmentSuggestionsService],
  exports: [AppointmentSuggestionsService],
})
export class AppointmentSuggestionsModule {}

