import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  doctorId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

