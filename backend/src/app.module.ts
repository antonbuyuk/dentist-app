import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { WorkplacesModule } from './workplaces/workplaces.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { FilesModule } from './files/files.module';
import { AppointmentSuggestionsModule } from './appointment-suggestions/appointment-suggestions.module';
import { ScheduleGateway } from './schedule.gateway';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Делаем ConfigModule глобальным
      envFilePath: '.env', // Путь к файлу .env
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    WorkplacesModule,
    NotificationsModule,
    EmailModule,
    MedicalRecordsModule,
    FilesModule,
    AppointmentSuggestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, ScheduleGateway],
})
export class AppModule {}
