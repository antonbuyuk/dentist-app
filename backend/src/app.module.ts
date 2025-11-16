import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ScheduleGateway } from './schedule.gateway';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
  ],
  controllers: [
    AppController,
    UsersController,
    AuthController,
  ],
  providers: [
    AppService,
    UsersService,
    AuthService,
    ScheduleGateway,
  ],
})
export class AppModule {}
