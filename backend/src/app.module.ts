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
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { DoctorsModule } from './doctors/doctors.module';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
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
    PatientsController,
    DoctorsController,
    AppointmentsController,
  ],
  providers: [
    AppService,
    UsersService,
    AuthService,
    PatientsService,
    DoctorsService,
    AppointmentsService,
  ],
})
export class AppModule {}
